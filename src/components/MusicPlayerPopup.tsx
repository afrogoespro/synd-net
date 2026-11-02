import React, { useState, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Play, Pause, Square, X, Music, Sparkles, Flame, Check } from 'lucide-react';
import { soundManager, AudioPlaybackState, JACKPOT_GIFS } from '../services/soundEffects';

interface MusicPlayerPopupProps {
  theme?: 'dark' | 'light';
}

export const MusicPlayerPopup: React.FC<MusicPlayerPopupProps> = ({ theme = 'dark' }) => {
  const [audioState, setAudioState] = useState<AudioPlaybackState>(soundManager.getState());
  const [showGifPicker, setShowGifPicker] = useState<boolean>(false);

  useEffect(() => {
    return soundManager.subscribe(setAudioState);
  }, []);

  if (!audioState.isPopupVisible) return null;

  const isDark = theme === 'dark';
  const volumePercent = Math.round(audioState.volume * 100);

  // Calculate progress relative to 8s - 16s range
  const totalClip = Math.max(1, audioState.endTime - audioState.startTime);
  const elapsedClip = Math.max(0, Math.min(totalClip, audioState.currentTime - audioState.startTime));
  const progressPercent = (elapsedClip / totalClip) * 100;

  return (
    <div className="fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-300 select-none">
      <div className={`w-80 rounded-3xl border shadow-2xl backdrop-blur-2xl overflow-hidden transition-all ${
        isDark 
          ? 'bg-[#090d18]/95 border-cyan-500/30 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]' 
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.15)]'
      }`}>
        {/* GIF Hero Visualizer */}
        <div className="relative h-28 w-full overflow-hidden bg-black/40 border-b border-white/10 group">
          <img
            src={audioState.activeGifUrl}
            alt="Jackpot GIF"
            className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d18] via-transparent to-black/30" />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full shadow-sm">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Jackpot Hit</span>
            </span>
            <span className="text-[9.5px] font-mono bg-cyan-500/20 backdrop-blur-md text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded-full font-semibold">
              8s - 16s Clip
            </span>
          </div>

          {/* Close X Button */}
          <button
            onClick={() => soundManager.setPopupVisible(false)}
            className="absolute top-2.5 right-3 p-1 rounded-full bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Dismiss Popup"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* GIF Switcher Toggle Pill */}
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            className="absolute bottom-2 right-3 text-[9px] font-semibold text-cyan-300 bg-black/60 hover:bg-black/80 border border-white/10 px-2 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>Switch GIF</span>
          </button>
        </div>

        {/* GIF Picker Drawer */}
        {showGifPicker && (
          <div className="p-2 border-b border-white/5 bg-black/50 grid grid-cols-3 gap-1.5 animate-in fade-in duration-150">
            {JACKPOT_GIFS.map((gif) => (
              <button
                key={gif.id}
                onClick={() => {
                  soundManager.setGifUrl(gif.url);
                  setShowGifPicker(false);
                }}
                className={`relative rounded-lg overflow-hidden border p-0.5 text-left transition-all cursor-pointer ${
                  audioState.activeGifUrl === gif.url 
                    ? 'border-cyan-400 ring-1 ring-cyan-400' 
                    : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={gif.url} alt={gif.name} className="w-full h-10 object-cover rounded" />
                <div className="text-[8.5px] font-bold text-center mt-0.5 truncate text-slate-300">
                  {gif.name}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Audio Controls & Slider Body */}
        <div className="p-3.5 space-y-3">
          {/* Track Info & Time Range */}
          <div className="flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <div className="font-bold text-white truncate flex items-center gap-1.5">
                <span>{audioState.trackName}</span>
                {audioState.isPlaying && (
                  <span className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="w-0.5 h-3 bg-emerald-300 rounded-full animate-bounce"></span>
                    <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {audioState.currentTime.toFixed(1)}s / {audioState.endTime.toFixed(1)}s
              </div>
            </div>

            {/* Play/Pause & Stop Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (audioState.isPlaying) {
                    soundManager.pause();
                  } else {
                    soundManager.resume();
                  }
                }}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                title={audioState.isPlaying ? 'Pause' : 'Play'}
              >
                {audioState.isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <button
                onClick={() => soundManager.stop()}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Stop & Reset to 8s"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress Bar (8s -> 16s range) */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>08.0s</span>
              <span>12.0s</span>
              <span>16.0s (Drop)</span>
            </div>
          </div>

          {/* Volume Slider (Default 50%) */}
          <div className="pt-1 flex items-center justify-between text-xs border-t border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400">
              {audioState.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : audioState.volume < 0.5 ? (
                <Volume1 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="text-[10px] font-semibold text-slate-300">Volume:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioState.volume}
                onChange={(e) => soundManager.setVolume(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                title={`Volume: ${volumePercent}%`}
              />
              <span className="text-[10px] font-mono font-bold tabular-nums text-cyan-300 min-w-[28px] text-right">
                {volumePercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
