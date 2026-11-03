import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, X, ArrowRight, Loader2, Lock, AlertCircle, Copy, Check, Settings2, UserCheck, KeyRound } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'sso' | 'lookup'>('sso');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom CCP Application Client ID & Callback
  const [clientId, setClientId] = useState<string>(() => {
    const stored = localStorage.getItem('synd_eve_client_id') || '';
    return stored === '83ad96423e904102b300736dd5440cb4' ? '' : stored;
  });
  const [showConfig, setShowConfig] = useState<boolean>(() => {
    const stored = localStorage.getItem('synd_eve_client_id') || '';
    return !stored || stored === '83ad96423e904102b300736dd5440cb4';
  });
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);

  // Instant Pilot Lookup Name
  const [pilotName, setPilotName] = useState<string>('');

  // Current Callback URL without trailing slash
  const callbackUrl = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : 'http://localhost:3000';

  useEffect(() => {
    if (isOpen) {
      authService.loadSharedConfig().then(sharedId => {
        if (sharedId && sharedId !== '83ad96423e904102b300736dd5440cb4' && !clientId) {
          setClientId(sharedId);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handleSaveClientId = (val: string) => {
    const clean = val.trim();
    setClientId(clean);
    authService.saveSharedClientId(clean);
  };

  // Primary 1-Click EVE Online SSO
  const handleSSORedirect = async () => {
    if (!clientId.trim()) {
      setShowConfig(true);
      setError('Please paste your CCP Application Client ID from developers.eveonline.com below.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.saveSharedClientId(clientId.trim());
      await authService.initiateEveSSO(clientId.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to connect to EVE Online SSO.');
      setLoading(false);
    }
  };

  // Instant Pilot Lookup via public CCP ESI
  const handleInstantLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotName.trim()) {
      setError('Please enter your character name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profile = await authService.loginWithCharacterName(pilotName.trim());
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Character lookup failed.');
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
        className="relative w-full max-w-md bg-[#0d1424]/95 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden text-slate-200"
      >
        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Bar */}
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

          {/* 2-Way Tab Switcher: EVE SSO vs Instant Pilot Lookup */}
          <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => { setActiveTab('sso'); setError(null); }}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'sso'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Official EVE SSO</span>
            </button>
            <button
              onClick={() => { setActiveTab('lookup'); setError(null); }}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'lookup'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Instant Pilot Lookup</span>
            </button>
          </div>

          {activeTab === 'sso' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your EVE Online account via CCP SSO to authorize your pilot and broadcast live position on the chain map.
              </p>

              {/* PRIMARY 1-CLICK SSO BUTTON */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleSSORedirect}
                  disabled={loading}
                  className={`w-full py-4 px-5 rounded-2xl border text-white font-bold text-sm flex items-center justify-between transition-all shadow-[0_4px_24px_rgba(0,0,0,0.5)] cursor-pointer group disabled:opacity-50 ${
                    clientId.trim()
                      ? 'bg-[#142036] hover:bg-[#1b2b48] border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_24px_rgba(6,182,212,0.35)]'
                      : 'bg-amber-950/30 hover:bg-amber-900/40 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tracking-wider bg-black/60 px-2 py-0.5 rounded border border-white/10 text-cyan-300 font-extrabold">
                      EVE
                    </span>
                    <span className="text-sm font-semibold tracking-wide text-white group-hover:text-cyan-200 transition-colors">
                      {clientId.trim() ? 'Sign in with EVE Online' : 'Paste Client ID Below to Sign In'}
                    </span>
                  </div>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              </div>

              {/* CCP Developer Settings */}
              <div className="border border-white/10 rounded-2xl p-3.5 bg-black/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CCP Application Setup (1-Time)</span>
                  </div>
                  {clientId.trim() && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 space-y-3">
                  {/* Step 1: Callback URL */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">1. Callback URL (developers.eveonline.com):</span>
                      <button
                        type="button"
                        onClick={handleCopyCallback}
                        className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        {copiedCallback ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-cyan-300 select-all break-all">
                      {callbackUrl}
                    </div>
                    <p className="text-[10px] text-amber-300/80 mt-1">
                      ⚠️ Make sure to click <strong className="text-amber-200">"SAVE CHANGES"</strong> at the bottom of the developer portal after pasting!
                    </p>
                  </div>

                  {/* Step 2: Client ID Input */}
                  <div>
                    <label className="block text-[11px] text-slate-300 font-medium mb-1">
                      2. Paste your CCP Application Client ID:
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => handleSaveClientId(e.target.value)}
                      placeholder="Paste 32-character Client ID from your CCP app"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Find the <strong>Client ID</strong> on your <span className="text-slate-300">Eve online Utility tracker</span> app page and paste it above. It automatically syncs to your fleet server!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INSTANT PILOT LOOKUP */
            <form onSubmit={handleInstantLookup} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in instantly with your EVE Online pilot name without configuring CCP developer keys. Fetches your portrait, corporation, and security status.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Character Name:
                </label>
                <input
                  type="text"
                  value={pilotName}
                  onChange={(e) => setPilotName(e.target.value)}
                  placeholder="e.g. Syndra en Tilavine"
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-purple-400 transition-all placeholder:text-slate-600 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !pilotName.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(168,85,247,0.35)] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Verify &amp; Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Error Banner if any */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Footer Notice */}
          <div className="pt-2 border-t border-white/5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Secure Authentication &bull; Character presence synced across fleet</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
