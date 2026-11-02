import React, { useState, useEffect } from 'react';
import { 
  Radar, Users, Flame, Cpu, Volume2, VolumeX, Clock, 
  Radio, Network, Pickaxe, ExternalLink, KeyRound, LogOut, User,
  LayoutDashboard, Sparkles, Sun, Moon
} from 'lucide-react';
import { authService, PilotProfile } from '../services/authService';
import { mapperService } from '../services/mapperService';
import { soundManager } from '../services/soundEffects';
import { PilotLoginModal } from './PilotLoginModal';

interface HeaderProps {
  activeTab: 'dashboard' | 'dscan' | 'mapper' | 'ore' | 'local' | 'killfeed' | 'eft';
  setActiveTab: (tab: 'dashboard' | 'dscan' | 'mapper' | 'ore' | 'local' | 'killfeed' | 'eft') => void;
  audioAlertsEnabled: boolean;
  setAudioAlertsEnabled: (enabled: boolean) => void;
  autoWatchEnabled: boolean;
  setAutoWatchEnabled: (enabled: boolean) => void;
  onSimulateWHEntry: (systemName: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  audioAlertsEnabled,
  setAudioAlertsEnabled,
  autoWatchEnabled,
  setAutoWatchEnabled,
  theme = 'dark',
  onToggleTheme
}) => {
  const [eveTime, setEveTime] = useState<string>('');
  const [currentPilot, setCurrentPilot] = useState<PilotProfile | null>(authService.getPilot());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [audioState, setAudioState] = useState(soundManager.getState());

  useEffect(() => {
    return soundManager.subscribe(setAudioState);
  }, []);

  useEffect(() => {
    return authService.subscribe((profile) => {
      setCurrentPilot(profile);
    });
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setEveTime(now.toISOString().slice(11, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === 'dark';

  return (
    <header className={`border-b sticky top-0 z-40 transition-colors duration-200 backdrop-blur-2xl ${
      isDark 
        ? 'bg-[#090d16]/85 border-white/10 text-gray-200 shadow-lg shadow-black/40' 
        : 'bg-white/85 border-slate-200/80 text-slate-800 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand (Apple Minimalist Glass) */}
          <div className="flex items-center gap-2.5">
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl overflow-hidden transition-all shadow-sm ${
              isDark 
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400' 
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/20 shadow-md'
            }`}>
              <Radar className="w-4 h-4 z-10 text-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className={`font-sans font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Synd<span className="text-cyan-500">.net</span>
                </span>
                <span className={`px-1.5 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-wider rounded-full ${
                  isDark 
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}>
                  PRO
                </span>
              </div>
              <p className={`text-[10px] tracking-tight font-sans mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tactical Recon &amp; Mapping
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Apple macOS / iOS Segmented Pill Control) */}
          <nav className={`hidden md:flex items-center gap-0.5 p-1 rounded-full border transition-all ${
            isDark 
              ? 'bg-black/40 border-white/10 shadow-inner' 
              : 'bg-slate-100/80 border-slate-200/70 shadow-inner'
          }`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? isDark 
                    ? 'bg-white/15 text-white font-semibold shadow-sm' 
                    : 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('mapper')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'mapper'
                  ? isDark 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm' 
                    : 'bg-white text-cyan-600 font-semibold shadow-sm border border-slate-200/60'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chain Mapper</span>
            </button>

            <button
              onClick={() => setActiveTab('dscan')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'dscan'
                  ? isDark 
                    ? 'bg-white/15 text-white font-semibold shadow-sm' 
                    : 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>D-Scan</span>
            </button>

            <button
              onClick={() => setActiveTab('ore')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'ore'
                  ? isDark 
                    ? 'bg-white/15 text-amber-300 font-semibold shadow-sm' 
                    : 'bg-white text-amber-600 font-semibold shadow-sm border border-slate-200/60'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
              <span>Ore &amp; Gas</span>
            </button>

            <button
              onClick={() => setActiveTab('local')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'local'
                  ? isDark 
                    ? 'bg-white/15 text-white font-semibold shadow-sm' 
                    : 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Local Intel</span>
            </button>

            <button
              onClick={() => setActiveTab('killfeed')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'killfeed'
                  ? isDark 
                    ? 'bg-white/15 text-orange-400 font-semibold shadow-sm' 
                    : 'bg-white text-orange-600 font-semibold shadow-sm border border-slate-200/60'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Killfeed</span>
            </button>

            <button
              onClick={() => setActiveTab('eft')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'eft'
                  ? isDark 
                    ? 'bg-white/15 text-indigo-300 font-semibold shadow-sm' 
                    : 'bg-white text-indigo-600 font-semibold shadow-sm border border-slate-200/60'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>EFT Analyzer</span>
            </button>
          </nav>

          {/* Controls: Auto-Watch, Audio, Time, Theme, Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoWatchEnabled(!autoWatchEnabled)}
              title={autoWatchEnabled ? 'Auto-Watch is Active' : 'Click to enable Auto-Watch'}
              className={`px-2.5 py-1 rounded-full text-[11px] font-sans flex items-center gap-1.5 transition-all ${
                autoWatchEnabled
                  ? isDark 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold'
                  : isDark ? 'bg-white/5 border border-white/5 text-slate-500 hover:text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoWatchEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="hidden sm:inline font-medium">
                {autoWatchEnabled ? 'Auto-Scout' : 'Paused'}
              </span>
            </button>

            {/* Volume & Music Slider Pill (Default 50%) */}
            <button
              onClick={() => soundManager.setPopupVisible(!audioState.isPopupVisible)}
              title={`Music & Tactical Volume: ${Math.round(audioState.volume * 100)}% (Click for Volume Slider & Controls)`}
              className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 transition-all ${
                audioState.isPopupVisible
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {audioState.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="text-[11px] font-mono font-semibold tabular-nums">
                {Math.round(audioState.volume * 100)}%
              </span>
            </button>

            {/* Theme Toggle (Light / Dark) */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Daylight Clean Mode' : 'Switch to Dark Mode'}
                className={`p-1.5 rounded-full border text-xs flex items-center transition-colors ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-amber-300 hover:bg-white/10' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-cyan-600" />}
              </button>
            )}

            <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-sans font-medium tabular-nums ${
              isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <Clock className="w-3 h-3 text-cyan-500" />
              <span>{eveTime} EVE</span>
            </div>

            {/* Pilot Profile & SSO Sign In */}
            {currentPilot ? (
              <div className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-all ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}>
                <img
                  src={currentPilot.avatarUrl}
                  alt={currentPilot.characterName}
                  className="w-5 h-5 rounded-full border border-cyan-400/50 object-cover"
                />
                <div className="hidden sm:block text-left leading-none">
                  <div className="font-semibold text-xs truncate max-w-[100px]">
                    {currentPilot.characterName}
                  </div>
                </div>
                <button
                  onClick={() => authService.logout()}
                  className="p-0.5 text-slate-400 hover:text-red-400 transition-colors ml-0.5"
                  title="Log Out / Switch Pilot"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs shadow-sm transition-all"
                title="Sign in with your EVE Online Character"
              >
                <KeyRound className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Pilot Login Modal */}
        <PilotLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={(profile) => {
            const activeSys = mapperService.getActiveSystem()?.id || 'J103955';
            mapperService.setPilotLocation(profile.characterName, activeSys);
          }}
        />

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-gray-800/80">
          <button
            onClick={() => setActiveTab('dscan')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium ${
              activeTab === 'dscan' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-gray-400'
            }`}
          >
            D-Scan
          </button>
          <button
            onClick={() => setActiveTab('mapper')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium ${
              activeTab === 'mapper' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-gray-400'
            }`}
          >
            Chain Mapper
          </button>
          <button
            onClick={() => setActiveTab('ore')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium ${
              activeTab === 'ore' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-gray-400'
            }`}
          >
            Ore Valuator
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium ${
              activeTab === 'local' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-gray-400'
            }`}
          >
            Local Intel
          </button>
          <button
            onClick={() => setActiveTab('killfeed')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium ${
              activeTab === 'killfeed' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-gray-400'
            }`}
          >
            Live Killfeed
          </button>
          <button
            onClick={() => setActiveTab('eft')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium ${
              activeTab === 'eft' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-gray-400'
            }`}
          >
            EFT Analyzer
          </button>
        </div>
      </div>
    </header>
  );
};
