import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, X, ArrowRight, Loader2, Lock, AlertCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Primary 1-Click EVE Online SSO: Takes user directly to CCP Character Selection (Authorize)
  const handleSSORedirect = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.initiateEveSSO();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to EVE Online SSO.');
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
        <div className="p-6 sm:p-7 space-y-6">
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

          {/* PRIMARY 1-CLICK SSO BUTTON */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleSSORedirect}
              disabled={loading}
              className="w-full py-4 px-5 rounded-2xl bg-[#142036] hover:bg-[#1b2b48] border border-cyan-500/40 hover:border-cyan-400 text-white font-bold text-sm flex items-center justify-between transition-all shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_0_24px_rgba(6,182,212,0.35)] cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tracking-wider bg-black/60 px-2 py-0.5 rounded border border-white/10 text-cyan-300 font-extrabold">
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
            <p className="text-[11px] text-slate-500 px-1 leading-normal text-center">
              EVE sign-in connects securely via CCP Games Official SSO to authorize character presence.
            </p>
          </div>

          {/* Error Banner if any */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Footer Notice */}
          <div className="pt-2 border-t border-white/5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Secure EVE Online SSO &bull; Character presence synced automatically</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
