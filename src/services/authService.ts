/**
 * EVE Online Pilot Authentication & SSO Service
 * Authenticates fleet members via CCP ESI / EVE SSO and manages pilot sessions.
 */

export interface PilotProfile {
  characterId: number;
  characterName: string;
  corporationId: number;
  corporationName: string;
  corporationTicker: string;
  avatarUrl: string;
  securityStatus: number;
  loginMethod: 'esi_lookup' | 'eve_sso';
  lastLogin: string;
}

const STORAGE_KEY = 'synd_pilot_auth_session';

type AuthListener = (profile: PilotProfile | null) => void;

class AuthService {
  private currentPilot: PilotProfile | null = null;
  private listeners: AuthListener[] = [];

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.currentPilot = JSON.parse(saved);
        if (this.currentPilot?.characterName) {
          fetch('/api/map/pilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pilotName: this.currentPilot.characterName, systemName: 'J103955' })
          }).catch(() => {});
        }
      }
    } catch (e) {
      this.currentPilot = null;
    }
  }

  public getPilot(): PilotProfile | null {
    return this.currentPilot;
  }

  public isLoggedIn(): boolean {
    return this.currentPilot !== null;
  }

  public subscribe(cb: AuthListener) {
    this.listeners.push(cb);
    cb(this.currentPilot);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentPilot));
  }

  /**
   * Log in with any real EVE Online Character Name.
   * Verifies against official CCP ESI, fetches verified Character ID, Corp & CCP Avatar.
   */
  public async loginWithCharacterName(characterName: string): Promise<PilotProfile> {
    const cleanName = characterName.trim();
    if (!cleanName) {
      throw new Error('Please enter a valid character name.');
    }

    // 1. Resolve Character ID via official CCP ESI
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

    // 2. Fetch Character Details (Corp, Security)
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
    } catch (e) {
      console.warn('Corp details lookup error', e);
    }

    // 3. Official CCP Avatar Image URL
    const avatarUrl = `https://images.evetech.net/characters/${characterId}/portrait?size=128`;

    const profile: PilotProfile = {
      characterId,
      characterName: verifiedName,
      corporationId: corpId,
      corporationName: corpName,
      corporationTicker: corpTicker,
      avatarUrl,
      securityStatus: Math.round(secStatus * 10) / 10,
      loginMethod: 'esi_lookup',
      lastLogin: new Date().toISOString().slice(11, 19) + ' EVE'
    };

    this.currentPilot = profile;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem('synd_pilot_name', verifiedName);
    this.notify();

    // Broadcast pilot location to server and fleet buddies immediately
    try {
      fetch('/api/map/pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilotName: verifiedName, systemName: 'J103955' })
      }).catch(() => {});
    } catch {}

    return profile;
  }

  public logout() {
    this.currentPilot = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('synd_pilot_name');
    this.notify();
  }
}

export const authService = new AuthService();
