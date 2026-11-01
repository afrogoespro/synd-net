import React, { useState } from 'react';
import { Shield, User, X, Check, ArrowRight, Loader2, KeyRound, Sparkles } from 'lucide-react';
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewProfile, setPreviewProfile] = useState<PilotProfile | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono text-xs">
      <div className="relative w-full max-w-md bg-[#0a0f1d] border-2 border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.35)] overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-[#0e1629] to-cyan-950 border-b border-cyan-500/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300">
              <KeyRound className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                PILOT SESSION ACCESS
              </div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Sign in with EVE Online Pilot
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <p className="text-gray-300 font-sans text-xs leading-relaxed">
            Sign in as your active pilot. Synd.net will verify your identity via <strong>official CCP ESI</strong>, pull your verified character portrait, and sync your live location to your fleet.
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1.5">
                EVE Character Name:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => {
                    setCharacterName(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  placeholder="e.g. USS Hauler or Syndra en Tilavine"
                  className="w-full bg-black/90 border border-gray-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none font-sans"
                />
                <User className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-sans">
                ⚠️ {error}
              </div>
            )}

            {previewProfile && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/60 flex items-center gap-3 animate-in zoom-in-95">
                <img
                  src={previewProfile.avatarUrl}
                  alt={previewProfile.characterName}
                  className="w-12 h-12 rounded-lg border border-emerald-400"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{previewProfile.characterName}</span>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    {previewProfile.corporationName} [{previewProfile.corporationTicker}]
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !characterName.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to CCP ESI...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Pilot</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick SSO Section */}
          <div className="pt-4 border-t border-gray-800 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
              Official CCP Integration
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-[11px] text-gray-400">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified Tranquility Public Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
