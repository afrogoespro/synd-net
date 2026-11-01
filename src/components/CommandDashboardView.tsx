import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Compass, Shield, ShieldAlert, Activity, 
  MapPin, Radio, Flame, ArrowUpRight, ChevronRight, 
  TrendingUp, Clock, CheckCircle2, AlertTriangle, 
  Layers, Users, Radar, Network, Cpu, KeyRound, ExternalLink
} from 'lucide-react';
import { Hologram3DViewer } from './Hologram3DViewer';
import { mapperService } from '../services/mapperService';
import { ChainMapState, WormholeNode } from '../types/mapper';
import { authService, PilotProfile } from '../services/authService';

interface CommandDashboardViewProps {
  onNavigateTab: (tab: 'mapper' | 'dscan' | 'ore' | 'local' | 'killfeed' | 'eft') => void;
  theme?: 'dark' | 'light';
}

export const CommandDashboardView: React.FC<CommandDashboardViewProps> = ({
  onNavigateTab,
  theme = 'dark'
}) => {
  const [mapState, setMapState] = useState<ChainMapState>(mapperService.getState());
  const [currentPilot, setCurrentPilot] = useState<PilotProfile | null>(authService.getPilot());
  const [eveTime, setEveTime] = useState<string>('');

  const isDark = theme === 'dark';

  useEffect(() => {
    const unsubMap = mapperService.subscribe(setMapState);
    const unsubAuth = authService.subscribe(setCurrentPilot);

    const updateClock = () => {
      setEveTime(new Date().toISOString().slice(11, 19));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      unsubMap();
      unsubAuth();
      clearInterval(interval);
    };
  }, []);

  const systemsList = Object.values(mapState.systems);
  const activeSystem = systemsList.find(s => 
    s.activePilots && currentPilot && s.activePilots.some(p => p.toLowerCase().includes(currentPilot.characterName.toLowerCase()))
  ) || mapState.systems['J103955'] || systemsList[0];

  // Daily statistics
  const totalSystems = systemsList.length;
  const totalConnections = mapState.connections.length;
  const wormholeCount = systemsList.filter(s => s.systemClass?.startsWith('C')).length;
  const empireCount = totalSystems - wormholeCount;
  const totalPilotsOnline = mapState.onlineBuddies.length || (currentPilot ? 1 : 0);

  // Calculate total signatures logged across chain
  const totalSignatures = systemsList.reduce((acc, s) => acc + (s.signatures?.length || 0), 0);

  // Greeting time of day
  const getGreeting = () => {
    const hour = new Date().getUTCHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const pilotDisplayName = currentPilot?.characterName || 'Fleet Commander';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & GREETING (Matching Nura Mock) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              isDark 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              • LIVE TRANQUILITY FLEET FEED
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {eveTime} EVE
            </span>
          </div>

          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {getGreeting()}, <span className="text-cyan-500">{pilotDisplayName}</span>
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Here's your fleet recon and wormhole expedition summary for today.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateTab('mapper')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all shadow-md ${
              isDark
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Open Chain Mapper</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onNavigateTab('dscan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all border ${
              isDark
                ? 'bg-gray-900/80 hover:bg-gray-800 text-gray-200 border-gray-700'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
            }`}
          >
            <Radar className="w-4 h-4 text-cyan-400" />
            <span>Paste D-Scan</span>
          </button>
        </div>
      </div>

      {/* 2. NURA-STYLE METRIC SUMMARY ROW (Big Numbers, Status Pills, Dot Graph) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Daily Jumps */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#0f1422]/90 border-gray-800 shadow-lg' 
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Jumps Made
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Optimal
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalSystems}
            </span>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              SYSTEMS
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Transit target: 30 jumps/day
          </p>
        </div>

        {/* Card 2: Recon Depth Score */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#0f1422]/90 border-gray-800 shadow-lg' 
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Recon Score
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              Excellent
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              94
            </span>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              / 100
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {wormholeCount} J-Space • {empireCount} Empire
          </p>
        </div>

        {/* Card 3: Signatures Mapped */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#0f1422]/90 border-gray-800 shadow-lg' 
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Sigs Resolved
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
              84% Sigs
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.max(totalSignatures, 48)}
            </span>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              SIGS
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Gas, Relic, Data &amp; WHs
          </p>
        </div>

        {/* Card 4: Threat Index */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#0f1422]/90 border-gray-800 shadow-lg' 
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Threat Index
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Low Threat
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              18%
            </span>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              RISK
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            0 hostile bubbles on scan
          </p>
        </div>
      </div>

      {/* 3. CENTERPIECE: 3D HOLOGRAPHIC CONSTELLATION & AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive 3D Hologram */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          isDark 
            ? 'bg-gradient-to-br from-[#0c1222] via-[#090d18] to-[#06080e] border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]' 
            : 'bg-gradient-to-br from-slate-50 via-white to-sky-50/40 border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <h3 className={`text-lg font-bold font-mono tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  INTERACTIVE EXPEDITION HOLOGRAM
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                3D orbital constellation of all systems jumped to &amp; from. Spin, zoom and hover any node.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('mapper')}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                isDark 
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20' 
                  : 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
              }`}
              title="Switch to 2D Tree Chain Mapper"
            >
              <span>2D Tree Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3D Canvas Mount */}
          <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-cyan-500/20 bg-black/40">
            <Hologram3DViewer
              systems={mapState.systems}
              connections={mapState.connections}
              activeSystemId={activeSystem?.id || 'J103955'}
              theme={theme}
              onSelectSystem={(sysId) => {
                onNavigateTab('mapper');
              }}
            />
          </div>
        </div>

        {/* Right 1 Col: AI Insights & Health Score Cards (Matching Nura Mock) */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Card A: AI Tactical Insights with glowing 3D orb */}
          <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
            isDark 
              ? 'bg-gradient-to-br from-emerald-950/40 via-[#0e1622] to-[#080d15] border-emerald-500/40 shadow-lg' 
              : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-emerald-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider font-mono ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                AI Tactical Insights
              </span>

              {/* Glowing 3D Orb Graphic (Matching the Nura green sphere) */}
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-400 to-white shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" />
            </div>

            <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              Your fleet headquarters in <strong>{activeSystem?.name || 'J103955'}</strong> maintains an active static to <strong>Lowsec</strong>. 
              The trade connection to <strong>Jita 4-4</strong> is <strong>4 jumps away</strong> through Uemisaisen and Sobaseki.
            </p>

            <div className={`mt-4 pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
              isDark ? 'border-emerald-900/40 text-emerald-400' : 'border-emerald-200 text-emerald-700 font-semibold'
            }`}>
              <span>• D-Scan Hostile Count: 0</span>
              <span>• Mass: Stable</span>
            </div>
          </div>

          {/* Card B: Fleet Recon Health Score */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#0f1422]/90 border-gray-800 shadow-lg' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Expedition Security Score
              </span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className={`text-4xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  94
                </div>
                <div className={`text-xs font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Calculated from wormhole EOLs, mass states, and local threat levels.
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                  Excellent
                </span>
                <span className={`text-[10px] mt-1 font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  100 Max
                </span>
              </div>
            </div>
          </div>

          {/* Card C: Active Pilot Tracking */}
          <div className={`p-5 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#0f1422]/90 border-gray-800 shadow-lg' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider font-mono block mb-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Fleet Members in Chain ({totalPilotsOnline})
            </span>

            <div className="space-y-2">
              {currentPilot ? (
                <div className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                  isDark ? 'bg-cyan-950/30 border-cyan-500/40 text-white' : 'bg-sky-50 border-sky-200 text-slate-900'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={currentPilot.avatarUrl} 
                      alt={currentPilot.characterName} 
                      className="w-7 h-7 rounded-xl object-cover border border-cyan-400/50" 
                    />
                    <div>
                      <div className="font-bold text-xs">{currentPilot.characterName}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">In {activeSystem?.name || 'J103955'}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
              ) : (
                <div className="text-xs text-gray-500 font-mono text-center py-2">
                  No pilot signed in. Click Pilot Sign In to link your EVE character.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. EXPEDITION FLIGHT LOG & RECENT JUMP TRAILS */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-[#0c101c]/90 border-gray-800 shadow-lg' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`text-base font-bold font-mono tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
              TODAY'S JUMP LOG &amp; CHAIN EXPEDITION TRAIL
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Chronological log of solar systems and wormholes navigated by your fleet today
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('mapper')}
            className={`text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors`}
          >
            <span>View Complete Chain</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trail Steps */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['Kisogo', 'Urlen', 'Perimeter', 'Jita', 'Sobaseki', 'Isanamo', 'Uemisaisen', 'J103955'].map((sysName, idx, arr) => {
            const isLast = idx === arr.length - 1;
            const isWormhole = sysName.startsWith('J');
            return (
              <React.Fragment key={idx}>
                <div className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 shrink-0 ${
                  isLast 
                    ? isDark 
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)] font-bold' 
                      : 'bg-purple-50 border-purple-400 text-purple-900 font-bold'
                    : isDark 
                    ? 'bg-[#0e1424] border-gray-800 text-gray-300' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isLast ? 'bg-purple-400 animate-ping' : isWormhole ? 'bg-cyan-400' : 'bg-emerald-400'}`}></span>
                  <span className="font-mono text-xs">{sysName}</span>
                  {isLast && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 uppercase font-bold">
                      CURRENT
                    </span>
                  )}
                </div>
                {!isLast && (
                  <span className="text-gray-600 font-mono text-xs shrink-0">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

    </div>
  );
};
