import React, { useState, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Play, Pause, Square, X, Music, Disc } from 'lucide-react';
import { soundManager, AudioPlaybackState } from '../services/soundEffects';

interface MusicPlayerPopupProps {
  theme?: 'dark' | 'light';
}

export const MusicPlayerPopup: React.FC<MusicPlayerPopupProps> = ({ theme = 'dark' }) => {
  const [audioState, setAudioState] = useState<AudioPlaybackState>(soundManager.getState());

  useEffect(() => {
    return soundManager.subscribe(setAudioState);
  }, []);

  if (!audioState.isPopupVisible) return null;

  const isDark = theme === 'dark';
  const volumePercent = Math.round(audioState.volume * 100);

  const formatSec = (sec: number) => {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = audioState.duration > 0 
    ? (audioState.currentTime / audioState.duration) * 100 
    : 0;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 select-none">
      <div className={`flex items-center gap-3.5 px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-2xl transition-all ${
        isDark 
          ? 'bg-[#0a0e1a]/95 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.6)]' 
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_12px_30px_rgba(0,0,0,0.12)]'
      }`}>
        {/* Animated Disc / Equalizer Indicator */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
          {audioState.isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
              <span className="w-0.5 h-3.5 bg-cyan-300 rounded-full animate-bounce"></span>
              <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              <span className="w-0.5 h-3 bg-cyan-300 rounded-full animate-bounce"></span>
            </div>
          ) : (
            <Music className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Track Title & Playhead Time */}
        <div className="min-w-[130px] max-w-[180px] leading-tight">
          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
            <span>{audioState.trackName}</span>
            {audioState.isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
            <span>{formatSec(audioState.currentTime)}</span>
            <div className="flex-1 h-1 bg-slate-700/40 rounded-full overflow-hidden w-16">
              <div 
                className="h-full bg-cyan-400 rounded-full transition-all duration-100" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{formatSec(audioState.duration)}</span>
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => {
            if (audioState.isPlaying) {
              soundManager.pause();
            } else {
              soundManager.resume();
            }
          }}
          className={`p-1.5 rounded-full border transition-colors ${
            isDark ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
          }`}
          title={audioState.isPlaying ? 'Pause' : 'Play'}
        >
          {audioState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        {/* Stop Button */}
        <button
          onClick={() => soundManager.stop()}
          className="p-1.5 rounded-full text-slate-400 hover:text-red-400 transition-colors"
          title="Stop Audio"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-5 bg-white/10"></span>

        {/* Volume Slider Control (Default 50%) */}
        <div className="flex items-center gap-2">
          {audioState.volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : audioState.volume < 0.5 ? (
            <Volume1 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioState.volume}
              onChange={(e) => soundManager.setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              title={`Volume: ${volumePercent}%`}
            />
            <span className="text-[10px] font-mono font-semibold tabular-nums text-slate-400 min-w-[28px]">
              {volumePercent}%
            </span>
          </div>
        </div>

        {/* Dismiss / Close X Button */}
        <button
          onClick={() => soundManager.setPopupVisible(false)}
          className="p-1 rounded-full text-slate-400 hover:text-white transition-colors ml-1"
          title="Close Popup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
