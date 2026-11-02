import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, User, X, Check, ArrowRight, Loader2, KeyRound, Sparkles, Lock, ExternalLink, Copy, AlertCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { authService, PilotProfile } from '../services/authService';

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
  const [characterName, setCharacterName] = useState<string>('');
  const [customClientId, setCustomClientId] = useState<string>(() => localStorage.getItem('synd_eve_client_id') || '');
  const [hasSharedClientId, setHasSharedClientId] = useState<boolean>(false);
  const [showHostSetup, setShowHostSetup] = useState<boolean>(false);
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewProfile, setPreviewProfile] = useState<PilotProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      authService.loadSharedConfig().then((cid) => {
        if (cid) {
          setCustomClientId(cid);
          setHasSharedClientId(true);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCallbackUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

  const handleCopyCallback = () => {
    if (navigator.clipboard && currentCallbackUrl) {
      navigator.clipboard.writeText(currentCallbackUrl);
      setCopiedCallback(true);
      setTimeout(() => setCopiedCallback(false), 2000);
    }
  };

  // Primary 1-Click EVE Online SSO: Takes user directly to CCP Character Selection (Authorize)
  const handleSSORedirect = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.initiateEveSSO(customClientId.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to initiate EVE SSO redirect.');
      setLoading(false);
      setShowHostSetup(true);
    }
  };

  // Host/Admin saves shared Client ID to server
  const handleSaveHostClientId = async () => {
    if (!customClientId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authService.saveSharedClientId(customClientId.trim());
      setHasSharedClientId(true);
      setShowHostSetup(false);
      setLoading(false);
      // Immediately initiate SSO
      await authService.initiateEveSSO(customClientId.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to save CCP Client ID.');
      setLoading(false);
    }
  };

  // Fast Zero-Config Character Name Lookup
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 font-sans text-xs select-none"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#0d1424]/95 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden text-slate-200"
      >
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto">
          {/* Header Bar matching standard EVE SSO tools (Spyntel/Tripwire) */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  SECURE ACCESS
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Sign in to Synd.net
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Use your EVE Online account to authenticate, submit intelligence, and link your live location on the chain mapper.
          </p>

          {/* PRIMARY ACTION: SIGN IN WITH EVE ONLINE (CCP SSO) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSSORedirect}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#142036] hover:bg-[#1b2b48] border border-cyan-500/40 hover:border-cyan-400 text-white font-bold text-sm flex items-center justify-between transition-all shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_0_24px_rgba(6,182,212,0.35)] cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {/* Official EVE Online Logo Typography */}
                <span className="font-mono text-xs tracking-wider bg-black/50 px-2 py-0.5 rounded border border-white/10 text-cyan-300 font-extrabold">
                  EVE
                </span>
                <span className="text-sm font-semibold tracking-wide text-white group-hover:text-cyan-200 transition-colors">
                  Sign in with EVE Online
                </span>
              </div>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
            <p className="text-[11px] text-slate-500 px-1 leading-normal">
              EVE sign-in connects securely via CCP Games Official SSO to authorize character presence.
            </p>
          </div>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-[#0d1424] px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              or instant pilot lookup
            </span>
          </div>

          {/* INSTANT ZERO-CONFIG PILOT LOOKUP */}
          <form onSubmit={handleNameLogin} className="space-y-3">
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
                  placeholder="e.g. USS Hauler or Syndra en Tilavine"
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !characterName.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In &amp; Link Pilot</span>}
            </button>
          </form>

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

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* COLLAPSIBLE HOST/DEVELOPER SETUP */}
          <div className="pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowHostSetup(!showHostSetup)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>{hasSharedClientId ? '⚙️ Host SSO Settings (Configured)' : '⚙️ Host SSO Setup (Set CCP Client ID)'}</span>
              </span>
              {showHostSetup ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showHostSetup && (
              <div className="mt-2.5 p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-[11px] animate-in fade-in duration-150">
                <div className="text-slate-400 text-[10px] leading-relaxed">
                  Enter your free CCP Application Client ID once. It is saved to the server so all fleet members (like USS Hauler) can use 1-click EVE SSO.
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-slate-300">Your Callback URL:</span>
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

                <div className="pt-1">
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    CCP Application Client ID:
                  </label>
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => {
                      setCustomClientId(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste Client ID from developers.eveonline.com"
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveHostClientId}
                  disabled={loading || !customClientId.trim()}
                  className="w-full mt-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  Save &amp; Activate SSO for Fleet
                </button>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Secure EVE Online SSO &bull; Local Memory Session Persistence</span>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
