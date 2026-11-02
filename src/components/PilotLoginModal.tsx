import React, { useState } from 'react';
import { Shield, User, X, Check, ArrowRight, Loader2, KeyRound, Sparkles, Lock, ExternalLink, Compass, Radio } from 'lucide-react';
import { authService, PilotProfile, EVE_SSO_SCOPES } from '../services/authService';

interface PilotLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: PilotProfile) => void;
}

export const PilotLoginModal: React.FC<PilotLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [authMode, setAuthMode] = useState<'sso' | 'token' | 'esi_name'>('sso');
  const [characterName, setCharacterName] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [customClientId, setCustomClientId] = useState<string>(() => localStorage.getItem('synd_eve_client_id') || '');
  const [showAdvancedSSO, setShowAdvancedSSO] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewProfile, setPreviewProfile] = useState<PilotProfile | null>(null);

  if (!isOpen) return null;

  const handleSSORedirect = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.initiateEveSSO(customClientId.trim() || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate EVE SSO redirect.');
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const profile = await authService.loginWithToken(tokenInput.trim());
      setPreviewProfile(profile);
      setTimeout(() => {
        onSuccess(profile);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired EVE SSO Token.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!characterName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const profile = await authService.loginWithCharacterName(characterName.trim());
      setPreviewProfile(profile);
      setTimeout(() => {
        onSuccess(profile);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify the character name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-150 font-sans text-xs select-none">
      <div className="relative w-full max-w-lg bg-[#0e1422]/95 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                Pilot Authentication &amp; Scope Access
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Connect to EVE Online
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex items-center gap-1">
          <div className="p-1 rounded-full bg-black/40 border border-white/5 flex items-center text-xs">
            <button
              onClick={() => { setAuthMode('sso'); setError(null); }}
              className={`px-3 py-1 rounded-full transition-all font-medium ${
                authMode === 'sso' 
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Official SSO
            </button>
            <button
              onClick={() => { setAuthMode('token'); setError(null); }}
              className={`px-3 py-1 rounded-full transition-all font-medium ${
                authMode === 'token' 
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SSO Token / Key
            </button>
            <button
              onClick={() => { setAuthMode('esi_name'); setError(null); }}
              className={`px-3 py-1 rounded-full transition-all font-medium ${
                authMode === 'esi_name' 
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pilot Lookup
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* TAB 1: OFFICIAL SSO */}
          {authMode === 'sso' && (
            <div className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Log in via official <strong>CCP EVE SSO</strong> with OAuth 2.0 PKCE. Grants secure real-time scope access to automatically track your solar system, active ship, and waypoints as you jump.
              </p>

              {/* Scopes Badge Grid */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Requested CCP ESI Scopes</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate" title="esi-location.read_location.v1">read_location.v1</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate" title="esi-location.read_ship_type.v1">read_ship_type.v1</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate" title="esi-location.read_online.v1">read_online.v1</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate" title="esi-ui.write_waypoint.v1">write_waypoint.v1</span>
                  </div>
                </div>
              </div>

              {/* Client ID Customization (collapsible) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSSO(!showAdvancedSSO)}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>{showAdvancedSSO ? 'Hide' : 'Custom'} CCP Application Client ID</span>
                </button>

                {showAdvancedSSO && (
                  <div className="mt-2 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <label className="block text-[10px] text-slate-400 font-semibold uppercase">
                      Client ID (from developers.eveonline.com):
                    </label>
                    <input
                      type="text"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="e.g. b79c3bdf1d074b629c118e698885b54a"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <div className="text-[10px] text-slate-500">
                      Redirect URI: <code className="text-cyan-400">{typeof window !== 'undefined' ? window.location.origin : ''}</code>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSSORedirect}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redirecting to EVE SSO...</span>
                  </>
                ) : (
                  <>
                    <img
                      src="https://images.evetech.net/corporations/1000125/logo?size=32"
                      alt="CCP"
                      className="w-4 h-4 rounded-full"
                    />
                    <span>Sign In with EVE Online SSO</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: TOKEN / REFRESH TOKEN */}
          {authMode === 'token' && (
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Paste an EVE SSO Access Token or JWT. Synd.net will decode your pilot identity, verify scopes, and begin polling live location directly.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  SSO Access Token / JWT:
                </label>
                <textarea
                  rows={3}
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste Bearer token (ey...)"
                  className="w-full bg-black/60 border border-white/10 focus:border-cyan-400 rounded-xl p-3 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify &amp; Activate Token</span>}
              </button>
            </form>
          )}

          {/* TAB 3: CHARACTER LOOKUP */}
          {authMode === 'esi_name' && (
            <form onSubmit={handleNameLogin} className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Sign in with your character name for instant public fleet mapping and portrait resolution via CCP ESI.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Character Name:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => {
                      setCharacterName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Syndra en Tilavine"
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !characterName.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authenticate Character</span>}
              </button>
            </form>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Success Preview */}
          {previewProfile && (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 animate-in zoom-in-95">
              <img
                src={previewProfile.avatarUrl}
                alt={previewProfile.characterName}
                className="w-10 h-10 rounded-full border border-emerald-400 object-cover"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{previewProfile.characterName}</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-emerald-300">
                  {previewProfile.corporationName} [{previewProfile.corporationTicker}]
                </div>
              </div>
            </div>
          )}

          {/* Footer Local Memory Notice */}
          <div className="pt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Local Memory active: Tokens &amp; session persist in secure localStorage</span>
          </div>

        </div>
      </div>
    </div>
  );
};
