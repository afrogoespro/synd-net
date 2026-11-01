import React, { useState, useEffect } from 'react';
import { Radar, Users, Flame, Cpu, Volume2, VolumeX, Clock, Radio, Network, Pickaxe, ExternalLink } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dscan' | 'mapper' | 'ore' | 'local' | 'killfeed' | 'eft';
  setActiveTab: (tab: 'dscan' | 'mapper' | 'ore' | 'local' | 'killfeed' | 'eft') => void;
  audioAlertsEnabled: boolean;
  setAudioAlertsEnabled: (enabled: boolean) => void;
  autoWatchEnabled: boolean;
  setAutoWatchEnabled: (enabled: boolean) => void;
  onSimulateWHEntry: (systemName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  audioAlertsEnabled,
  setAudioAlertsEnabled,
  autoWatchEnabled,
  setAutoWatchEnabled,
}) => {
  const [eveTime, setEveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setEveTime(now.toUTCString().slice(17, 25));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-cyan-900/30 bg-[#0c101c]/90 backdrop-blur sticky top-0 z-40 shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <div className="absolute inset-0 radar-sweep"></div>
              <Radar className="w-5 h-5 z-10 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg tracking-wider text-cyan-300">
                  SYND<span className="text-amber-400">.NET</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                  CHAIN &amp; ORE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 tracking-wide font-mono">
                SYND.NET TACTICAL RECON
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setActiveTab('dscan')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dscan'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>D-Scan</span>
            </button>

            <button
              onClick={() => setActiveTab('mapper')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'mapper'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Chain Mapper</span>
            </button>

            <button
              onClick={() => setActiveTab('ore')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'ore'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Pickaxe className="w-4 h-4 text-amber-400" />
              <span>Ore &amp; Gas Valuator</span>
            </button>

            <button
              onClick={() => setActiveTab('local')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'local'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Local Intel</span>
            </button>

            <button
              onClick={() => setActiveTab('killfeed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'killfeed'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Live Killfeed</span>
            </button>

            <button
              onClick={() => setActiveTab('eft')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'eft'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>EFT Analyzer</span>
            </button>
          </nav>

          {/* Controls: Auto-Watch, Audio, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-mono shadow-[0_0_10px_rgba(16,185,129,0.15)]"
              title="Official CCP ESI Tranquility Market Feed (Jita 4-4)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold">CCP ESI: JITA 4-4</span>
            </div>
            <button
              onClick={() => setAutoWatchEnabled(!autoWatchEnabled)}
              title={autoWatchEnabled ? 'Auto-Watch is Active' : 'Click to enable Auto-Watch'}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                autoWatchEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoWatchEnabled ? 'animate-pulse text-cyan-400' : ''}`} />
              <span className="hidden sm:inline font-bold">
                {autoWatchEnabled ? 'AUTO-SCOUT: ON' : 'AUTO-SCOUT: OFF'}
              </span>
            </button>

            <button
              onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
              title={audioAlertsEnabled ? 'Disable Tactical Audio Alarms' : 'Enable Tactical Audio Alarms'}
              className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                audioAlertsEnabled
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-400'
              }`}
            >
              {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-cyan-950/80 rounded-lg text-cyan-400/90 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span>{eveTime} EVE</span>
            </div>
          </div>
        </div>

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
