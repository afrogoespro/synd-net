/**
 * EVE Online Pilot Authentication & SSO Service
 * Implements CCP ESI, EVE SSO OAuth 2.0 PKCE flow, and Scope Access management:
 * - esi-location.read_location.v1 (Live character solar system tracking)
 * - esi-location.read_ship_type.v1 (Live character active ship tracking)
 * - esi-location.read_online.v1 (Online status)
 * - esi-ui.write_waypoint.v1 (Autopilot waypoint setting in EVE Client)
 * - esi-ui.open_window.v1 (Opening market/info in EVE Client)
 * 
 * Local Memory: Persists tokens, scopes, and pilot session in localStorage.
 */

export interface PilotProfile {
  characterId: number;
  characterName: string;
  corporationId: number;
  corporationName: string;
  corporationTicker: string;
  avatarUrl: string;
  securityStatus: number;
  loginMethod: 'esi_lookup' | 'eve_sso' | 'sso_token';
  scopes: string[];
  activeShip?: string;
  currentSystem?: string;
  isOnline?: boolean;
  lastLogin: string;
}

export interface SSOTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  characterId: number;
  characterName: string;
  scopes: string[];
}

export const EVE_SSO_SCOPES = [
  'esi-location.read_location.v1',
  'esi-location.read_ship_type.v1',
  'esi-location.read_online.v1',
  'esi-ui.open_window.v1',
  'esi-ui.write_waypoint.v1',
  'esi-wallet.read_character_wallet.v1'
];

export const WALLET_SCOPE = 'esi-wallet.read_character_wallet.v1';

const STORAGE_KEY_PILOT = 'synd_pilot_auth_session';
const STORAGE_KEY_TOKENS = 'synd_sso_tokens';
const STORAGE_KEY_CLIENT_ID = 'synd_eve_client_id';
const STORAGE_KEY_PKCE_VERIFIER = 'synd_sso_pkce_verifier';
const STORAGE_KEY_STATE = 'synd_sso_state';

type AuthListener = (profile: PilotProfile | null) => void;
type LocationListener = (data: { systemId: number; systemName: string; shipName?: string }) => void;

// Helper: base64url encoding
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate random string for PKCE code verifier
function generateRandomString(length: number = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

// SHA-256 hash for PKCE challenge
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

class AuthService {
  private currentPilot: PilotProfile | null = null;
  private ssoTokens: SSOTokenData | null = null;
  private listeners: AuthListener[] = [];
  private locationListeners: LocationListener[] = [];
  private trackingInterval: any = null;
  private systemNameCache: Record<number, string> = {};
  private shipNameCache: Record<number, string> = {};

  constructor() {
    this.loadSession();
    this.loadSharedConfig();
    this.checkSSOCallback();
    if (this.currentPilot && this.ssoTokens?.accessToken) {
      this.startLocationTracking();
    }
  }

  /**
   * Loads shared CCP Client ID from the backend server so buddies inherit it automatically.
   */
  public async loadSharedConfig(): Promise<string> {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        if (data.clientId) {
          localStorage.setItem(STORAGE_KEY_CLIENT_ID, data.clientId);
          return data.clientId;
        }
      }
    } catch {}
    return localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '';
  }

  /**
   * Saves shared CCP Client ID to backend server so all fleet members can use 1-click SSO.
   */
  public async saveSharedClientId(clientId: string): Promise<boolean> {
    const clean = (clientId || '').trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, clean);
    }
    try {
      const res = await fetch('/api/auth/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clean })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private loadSession() {
    try {
      const savedPilot = localStorage.getItem(STORAGE_KEY_PILOT);
      if (savedPilot) {
        this.currentPilot = JSON.parse(savedPilot);
      }
      const savedTokens = localStorage.getItem(STORAGE_KEY_TOKENS);
      if (savedTokens) {
        this.ssoTokens = JSON.parse(savedTokens);
      }
      const cachedSystems = localStorage.getItem('synd_system_name_cache');
      if (cachedSystems) {
        this.systemNameCache = JSON.parse(cachedSystems);
      }
    } catch (e) {
      this.currentPilot = null;
      this.ssoTokens = null;
    }
  }

  public getPilot(): PilotProfile | null {
    return this.currentPilot;
  }

  public getTokens(): SSOTokenData | null {
    return this.ssoTokens;
  }

  public isLoggedIn(): boolean {
    return this.currentPilot !== null;
  }

  public hasScope(scope: string): boolean {
    if (!this.currentPilot || !this.currentPilot.scopes) return false;
    return this.currentPilot.scopes.includes(scope);
  }

  public subscribe(cb: AuthListener) {
    this.listeners.push(cb);
    cb(this.currentPilot);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public onLocationUpdate(cb: LocationListener) {
    this.locationListeners.push(cb);
    return () => {
      this.locationListeners = this.locationListeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentPilot));
  }

  /**
   * Generates EVE SSO PKCE URL and redirects to CCP login.
   * Scopes: esi-location.read_location.v1, esi-location.read_ship_type.v1, esi-location.read_online.v1, esi-ui.write_waypoint.v1
   */
  public async initiateEveSSO(customClientId?: string) {
    let clientId = (customClientId || '').trim() || localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '';
    if (!clientId) {
      clientId = await this.loadSharedConfig();
    }
    const envClientId = (import.meta as any).env?.VITE_EVE_CLIENT_ID;
    if (!clientId && envClientId) {
      clientId = String(envClientId).trim();
    }

    if (!clientId) {
      throw new Error(
        'EVE SSO is not configured yet. Please configure a CCP Client ID, or use instant Pilot Lookup below.'
      );
    }

    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);

    const state = generateRandomString(24);
    const codeVerifier = generateRandomString(64);
    const challengeHash = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(challengeHash);

    // Save in local memory for when callback returns
    localStorage.setItem(STORAGE_KEY_STATE, state);
    localStorage.setItem(STORAGE_KEY_PKCE_VERIFIER, codeVerifier);

    const redirectUri = window.location.origin + window.location.pathname;
    const scopeParam = encodeURIComponent(EVE_SSO_SCOPES.join(' '));

    const ssoUrl = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${encodeURIComponent(clientId)}&scope=${scopeParam}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

    window.location.href = ssoUrl;
  }

  /**
   * Checks URL query params for EVE SSO OAuth callback code.
   */
  private async checkSSOCallback() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) return;

    const savedState = localStorage.getItem(STORAGE_KEY_STATE);
    const codeVerifier = localStorage.getItem(STORAGE_KEY_PKCE_VERIFIER);
    const envClientId = (import.meta as any).env?.VITE_EVE_CLIENT_ID;
    const clientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID) || (envClientId ? String(envClientId).trim() : '');

    // Clean URL query parameters cleanly without page reload
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    if (savedState && state !== savedState) {
      console.error('[EVE SSO] State verification mismatch');
      return;
    }

    if (!clientId) {
      console.error('[EVE SSO] Cannot complete OAuth callback: No Client ID found.');
      return;
    }

    try {
      const redirectUri = cleanUrl;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        code_verifier: codeVerifier || '',
        redirect_uri: redirectUri
      });

      const tokenRes = await fetch('https://login.eveonline.com/v2/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Host': 'login.eveonline.com' },
        body: body.toString()
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        await this.handleTokenPayload(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in);
      }
    } catch (err) {
      console.error('[EVE SSO] Token exchange error:', err);
    }
  }

  /**
   * Parses token payload, resolves character via EVE ESI, and saves session.
   */
  public async handleTokenPayload(accessToken: string, refreshToken?: string, expiresIn: number = 1200) {
    let characterId = 0;
    let characterName = 'SSO Pilot';
    let scopes: string[] = [];

    // Decode JWT payload
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        characterName = payload.name || characterName;
        // sub is e.g. "CHARACTER:EVE:2114758921"
        if (payload.sub && payload.sub.includes(':')) {
          characterId = parseInt(payload.sub.split(':').pop() || '0', 10);
        }
        if (Array.isArray(payload.scp)) {
          scopes = payload.scp;
        } else if (typeof payload.scp === 'string') {
          scopes = [payload.scp];
        }
      }
    } catch (e) {
      console.warn('[EVE SSO] JWT decode warning:', e);
    }

    // Verify via CCP ESI /verify or character endpoint if ID not in JWT
    if (!characterId) {
      try {
        const verifyRes = await fetch('https://login.eveonline.com/oauth/verify', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (verifyRes.ok) {
          const vData = await verifyRes.json();
          characterId = vData.CharacterID;
          characterName = vData.CharacterName;
          if (vData.Scopes) {
            scopes = vData.Scopes.split(' ');
          }
        }
      } catch (err) {}
    }

    if (!characterId) {
      throw new Error('Could not verify Character ID from EVE SSO token.');
    }

    // Fetch Corp & Details from ESI
    let corpName = 'Corporation';
    let corpTicker = '';
    let corpId = 0;
    let secStatus = 1.0;

    try {
      const charRes = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/`);
      if (charRes.ok) {
        const charDetails = await charRes.json();
        corpId = charDetails.corporation_id || 0;
        secStatus = charDetails.security_status || 0;

        if (corpId) {
          const corpRes = await fetch(`https://esi.evetech.net/latest/corporations/${corpId}/`);
          if (corpRes.ok) {
            const corpDetails = await corpRes.json();
            corpName = corpDetails.name || 'Corporation';
            corpTicker = corpDetails.ticker || '';
          }
        }
      }
    } catch (e) {}

    const tokenObj: SSOTokenData = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000),
      characterId,
      characterName,
      scopes: scopes.length > 0 ? scopes : EVE_SSO_SCOPES
    };

    const profile: PilotProfile = {
      characterId,
      characterName,
      corporationId: corpId,
      corporationName: corpName,
      corporationTicker: corpTicker,
      avatarUrl: `https://images.evetech.net/characters/${characterId}/portrait?size=128`,
      securityStatus: Math.round(secStatus * 10) / 10,
      loginMethod: 'eve_sso',
      scopes: tokenObj.scopes,
      lastLogin: new Date().toISOString().slice(11, 19) + ' EVE'
    };

    this.ssoTokens = tokenObj;
    this.currentPilot = profile;

    // Save to Local Memory
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokenObj));
    localStorage.setItem(STORAGE_KEY_PILOT, JSON.stringify(profile));
    localStorage.setItem('synd_pilot_name', characterName);

    this.notify();
    this.startLocationTracking();

    return profile;
  }

  /**
   * Log in with an EVE SSO Bearer / Access token directly.
   */
  public async loginWithToken(token: string): Promise<PilotProfile> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('Please enter a valid SSO Access Token.');
    }
    return this.handleTokenPayload(cleanToken);
  }

  /**
   * Log in with verified EVE Online Character Name (Direct public ESI).
   */
  public async loginWithCharacterName(characterName: string): Promise<PilotProfile> {
    const cleanName = characterName.trim();
    if (!cleanName) {
      throw new Error('Please enter a valid character name.');
    }

    const idRes = await fetch('https://esi.evetech.net/latest/universe/ids/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([cleanName])
    });

    if (!idRes.ok) {
      throw new Error('Unable to connect to CCP ESI service. Please try again.');
    }

    const idData = await idRes.json();
    if (!idData.characters || idData.characters.length === 0) {
      throw new Error(`Character "${cleanName}" was not found in New Eden.`);
    }

    const charInfo = idData.characters[0];
    const characterId = charInfo.id;
    const verifiedName = charInfo.name;

    let corpName = 'Independent Pilot';
    let corpTicker = '';
    let corpId = 0;
    let secStatus = 1.0;

    try {
      const charRes = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/`);
      if (charRes.ok) {
        const charDetails = await charRes.json();
        corpId = charDetails.corporation_id || 0;
        secStatus = charDetails.security_status || 0;

        if (corpId) {
          const corpRes = await fetch(`https://esi.evetech.net/latest/corporations/${corpId}/`);
          if (corpRes.ok) {
            const corpDetails = await corpRes.json();
            corpName = corpDetails.name || 'Corporation';
            corpTicker = corpDetails.ticker || '';
          }
        }
      }
    } catch (e) {}

    const profile: PilotProfile = {
      characterId,
      characterName: verifiedName,
      corporationId: corpId,
      corporationName: corpName,
      corporationTicker: corpTicker,
      avatarUrl: `https://images.evetech.net/characters/${characterId}/portrait?size=128`,
      securityStatus: Math.round(secStatus * 10) / 10,
      loginMethod: 'esi_lookup',
      scopes: ['publicData'],
      lastLogin: new Date().toISOString().slice(11, 19) + ' EVE'
    };

    this.currentPilot = profile;
    localStorage.setItem(STORAGE_KEY_PILOT, JSON.stringify(profile));
    localStorage.setItem('synd_pilot_name', verifiedName);
    this.notify();

    return profile;
  }

  /**
   * Resolves a solar system ID to solar system name via ESI (cached in Local Memory).
   */
  public async resolveSystemName(systemId: number): Promise<string> {
    if (this.systemNameCache[systemId]) {
      return this.systemNameCache[systemId];
    }
    try {
      const res = await fetch(`https://esi.evetech.net/latest/universe/systems/${systemId}/`);
      if (res.ok) {
        const data = await res.json();
        if (data.name) {
          this.systemNameCache[systemId] = data.name;
          localStorage.setItem('synd_system_name_cache', JSON.stringify(this.systemNameCache));
          return data.name;
        }
      }
    } catch {}
    return `System-${systemId}`;
  }

  /**
   * Resolves a ship type ID to ship type name via ESI.
   */
  public async resolveShipName(shipTypeId: number): Promise<string> {
    if (this.shipNameCache[shipTypeId]) {
      return this.shipNameCache[shipTypeId];
    }
    try {
      const res = await fetch(`https://esi.evetech.net/latest/universe/types/${shipTypeId}/`);
      if (res.ok) {
        const data = await res.json();
        if (data.name) {
          this.shipNameCache[shipTypeId] = data.name;
          return data.name;
        }
      }
    } catch {}
    return 'Ship';
  }

  /**
   * Starts live ESI background location & ship polling using esi-location scopes.
   */
  public startLocationTracking(intervalMs: number = 5000) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    const checkLocation = async () => {
      if (!this.currentPilot || !this.ssoTokens?.accessToken) return;
      const charId = this.currentPilot.characterId;

      try {
        // 1. Check Location (esi-location.read_location.v1)
        const locRes = await fetch(`https://esi.evetech.net/latest/characters/${charId}/location/`, {
          headers: { 'Authorization': `Bearer ${this.ssoTokens.accessToken}` }
        });

        if (locRes.ok) {
          const locData = await locRes.json();
          const systemId = locData.solar_system_id;
          if (systemId) {
            const systemName = await this.resolveSystemName(systemId);
            if (this.currentPilot.currentSystem !== systemName) {
              this.currentPilot.currentSystem = systemName;
              localStorage.setItem(STORAGE_KEY_PILOT, JSON.stringify(this.currentPilot));
              this.notify();
              this.locationListeners.forEach(cb => cb({ systemId, systemName, shipName: this.currentPilot?.activeShip }));
            }
          }
        }

        // 2. Check Ship (esi-location.read_ship_type.v1)
        const shipRes = await fetch(`https://esi.evetech.net/latest/characters/${charId}/ship/`, {
          headers: { 'Authorization': `Bearer ${this.ssoTokens.accessToken}` }
        });
        if (shipRes.ok) {
          const shipData = await shipRes.json();
          if (shipData.ship_type_id) {
            const shipName = await this.resolveShipName(shipData.ship_type_id);
            if (this.currentPilot.activeShip !== shipName) {
              this.currentPilot.activeShip = shipName;
              this.notify();
            }
          }
        }
      } catch (err) {
        // Silently retry on transient network errors
      }
    };

    // Run first check immediately, then schedule
    checkLocation();
    this.trackingInterval = setInterval(checkLocation, intervalMs);
  }

  public stopLocationTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  /**
   * Set autopilot destination in EVE Client using esi-ui.write_waypoint.v1.
   */
  public async setInGameWaypoint(solarSystemId: number, clearOtherWaypoints: boolean = false): Promise<boolean> {
    if (!this.ssoTokens?.accessToken) {
      console.warn('EVE SSO token required to set in-game waypoint.');
      return false;
    }

    try {
      const url = `https://esi.evetech.net/latest/ui/autopilot/waypoint/?destination_id=${solarSystemId}&clear_other_waypoints=${clearOtherWaypoints}&add_to_beginning=false`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.ssoTokens.accessToken}` }
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to set in-game waypoint:', e);
      return false;
    }
  }

  /**
   * Returns a non-expired SSO access token, refreshing it with the stored
   * refresh token (PKCE public client) when it is within 60s of expiry.
   */
  public async getValidAccessToken(): Promise<string | null> {
    if (!this.ssoTokens?.accessToken) return null;
    if (this.ssoTokens.expiresAt - Date.now() > 60_000) return this.ssoTokens.accessToken;

    const clientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (!this.ssoTokens.refreshToken || !clientId) return this.ssoTokens.accessToken;

    try {
      const res = await fetch('https://login.eveonline.com/v2/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.ssoTokens.refreshToken,
          client_id: clientId
        }).toString()
      });
      if (!res.ok) return this.ssoTokens.accessToken;
      const data = await res.json();
      this.ssoTokens = {
        ...this.ssoTokens,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.ssoTokens.refreshToken,
        expiresAt: Date.now() + (data.expires_in || 1200) * 1000
      };
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(this.ssoTokens));
      return this.ssoTokens.accessToken;
    } catch {
      return this.ssoTokens.accessToken;
    }
  }

  public logout() {
    this.stopLocationTracking();
    this.currentPilot = null;
    this.ssoTokens = null;
    localStorage.removeItem(STORAGE_KEY_PILOT);
    localStorage.removeItem(STORAGE_KEY_TOKENS);
    localStorage.removeItem('synd_pilot_name');
    this.notify();
  }
}

export const authService = new AuthService();
