import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, User, X, Check, ArrowRight, Loader2, KeyRound, Sparkles, Lock, ExternalLink, Copy, HelpCircle, AlertCircle } from 'lucide-react';
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
  const [authMode, setAuthMode] = useState<'esi_name' | 'sso' | 'token'>('esi_name');
  const [characterName, setCharacterName] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [customClientId, setCustomClientId] = useState<string>(() => localStorage.getItem('synd_eve_client_id') || '');
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewProfile, setPreviewProfile] = useState<PilotProfile | null>(null);

  if (!isOpen) return null;

  const currentCallbackUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

  const handleCopyCallback = () => {
    if (navigator.clipboard && currentCallbackUrl) {
      navigator.clipboard.writeText(currentCallbackUrl);
      setCopiedCallback(true);
      setTimeout(() => setCopiedCallback(false), 2000);
    }
  };

  const handleSSORedirect = async () => {
    if (!customClientId.trim()) {
      setError('Please paste your CCP Client ID from developers.eveonline.com to proceed with SSO.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem('synd_eve_client_id', customClientId.trim());
      await authService.initiateEveSSO(customClientId.trim());
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
      setError(err.message || 'Pilot lookup failed. Please verify the exact character name.');
    } finally {
      setLoading(false);
    }
  };

  // Rendered via portal into <body> so parent transforms / backdrop-filters
  // can't hijack `position: fixed`.
  // Using items-start with py-12 and my-auto guarantees the modal is centered when space permits,
  // while ensuring the top header is NEVER clipped or inaccessible on smaller viewports.
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 font-sans text-xs select-none"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="min-h-full flex justify-center items-start sm:items-center py-12 px-4"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg my-auto bg-[#0e1422]/95 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden text-slate-200"
        >
        
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
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex items-center gap-1">
          <div className="p-1 rounded-full bg-black/50 border border-white/5 flex items-center text-xs">
            <button
              onClick={() => { setAuthMode('esi_name'); setError(null); }}
              className={`px-3 py-1 rounded-full transition-all font-medium cursor-pointer ${
                authMode === 'esi_name' 
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pilot Lookup (Instant)
            </button>
            <button
              onClick={() => { setAuthMode('sso'); setError(null); }}
              className={`px-3 py-1 rounded-full transition-all font-medium cursor-pointer ${
                authMode === 'sso' 
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Official CCP SSO
            </button>
            <button
              onClick={() => { setAuthMode('token'); setError(null); }}
              className={`px-3 py-1 rounded-full transition-all font-medium cursor-pointer ${
                authMode === 'token' 
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Token / eveauth
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* TAB 1: CHARACTER LOOKUP (RECOMMENDED / ZERO-CONFIG) */}
          {authMode === 'esi_name' && (
            <form onSubmit={handleNameLogin} className="space-y-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-slate-300 text-xs leading-relaxed">
                <span className="text-cyan-400 font-semibold">Instant Zero-Config Mode:</span> Enter your in-game character name. Synd.net will verify your identity via CCP ESI, pull your portrait, corporation ticker, and attach you to the chain mapper immediately.
              </div>

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
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !characterName.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authenticate &amp; Link Pilot</span>}
              </button>
            </form>
          )}

          {/* TAB 2: OFFICIAL CCP SSO (OAUTH 2.0 PKCE) */}
          {authMode === 'sso' && (
            <div className="space-y-3.5">
              <div className="text-slate-300 text-xs leading-relaxed">
                CCP Tranquility requires OAuth applications to match the exact origin URL. Register a free developer app to enable live ESI location scopes.
              </div>

              {/* Step-by-Step CCP App Setup Card */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5 text-[11px]">
                <div className="font-semibold text-cyan-400 flex items-center justify-between">
                  <span>Step 1: Your Instance Callback URL</span>
                  <button
                    type="button"
                    onClick={handleCopyCallback}
                    className="flex items-center gap-1 text-[10px] bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {copiedCallback ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-1.5 rounded bg-black/60 border border-white/5 font-mono text-[10px] text-slate-300 break-all select-all">
                  {currentCallbackUrl}
                </div>

                <div className="font-semibold text-slate-300 flex items-center justify-between pt-1">
                  <span>Step 2: Register on CCP Developers</span>
                  <a
                    href="https://developers.eveonline.com/applications/create"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                  >
                    <span>developers.eveonline.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-[10px] text-slate-400">
                  Select <strong className="text-slate-200">Authentication &amp; API Access</strong>, paste the Callback URL above, and add scopes: <code className="text-emerald-400">esi-location.read_location.v1</code>.
                </div>

                <div className="font-semibold text-slate-300 pt-1">
                  Step 3: Paste Generated Client ID
                </div>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => {
                    setCustomClientId(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste CCP Client ID (e.g. 7f4a...)"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Scopes Badge Grid */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Requested Scopes</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    <Check className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">read_location.v1</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    <Check className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">read_ship_type.v1</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSSORedirect}
                disabled={loading || !customClientId.trim()}
                className={`w-full py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  customClientId.trim()
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-lg shadow-cyan-500/20'
                    : 'bg-white/10 text-slate-400 cursor-not-allowed opacity-60'
                }`}
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
                    <span>{customClientId.trim() ? 'Sign In with EVE Online SSO' : 'Enter CCP Client ID above to enable SSO'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setAuthMode('esi_name'); setError(null); }}
                  className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Don't have a CCP App? Use instant Pilot Lookup instead &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TOKEN / EVEAUTH */}
          {authMode === 'token' && (
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Paste an active EVE SSO Access Token or eveauth JWT. Synd.net will decode your pilot identity, verify location scopes, and begin polling live telemetry.
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
                  placeholder="Paste Bearer token (eyJ...)"
                  className="w-full bg-black/60 border border-white/10 focus:border-cyan-400 rounded-xl p-3 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify &amp; Activate Token</span>}
              </button>
            </form>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
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
    </div>,
    document.body
  );
};
