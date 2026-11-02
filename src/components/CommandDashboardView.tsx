import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Compass, Shield, ShieldAlert, Activity, 
  MapPin, Radio, Flame, ArrowUpRight, ChevronRight, 
  TrendingUp, Clock, CheckCircle2, AlertTriangle, 
  Layers, Users, Radar, Network, Cpu, KeyRound, ExternalLink,
  Search, Bell, User, Plus, Box, Check, Hourglass
} from 'lucide-react';
import { Hologram3DViewer } from './Hologram3DViewer';
import { mapperService } from '../services/mapperService';
import { ChainMapState, WormholeNode, StructureTimer } from '../types/mapper';
import { authService, PilotProfile } from '../services/authService';
import { StructureTimerModal } from './StructureTimerModal';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [activeViewerMode, setActiveViewerMode] = useState<'3d' | 'stats'>('3d');

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
  const totalSignatures = systemsList.reduce((acc, s) => acc + (s.signatures?.length || 0), 0);
  const timersList = mapState.timers || [];

  // Greeting time of day
  const getGreeting = () => {
    const hour = new Date().getUTCHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const pilotDisplayName = currentPilot?.characterName ? currentPilot.characterName.split(' ')[0] : 'Commander';

  // Sample timeline activity pills matching Nura style
  const timelinePills = [
    { label: '01:42 EVE', text: 'Jump Ajanen ➔ Kuoka', type: 'jump' },
    { label: '01:45 EVE', text: 'J103955 Scouted', type: 'wh' },
    { label: '01:49 EVE', text: '4x Astrahus on Scan', type: 'struct' },
    { label: '01:52 EVE', text: 'ZKillboard Quiet (0 Kills)', type: 'intel' },
    { label: '01:54 EVE', text: 'Trade Route: 4 Jumps to Jita', type: 'route' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans pb-10">
      
      {/* 1. APPLE SEARCH & QUICK PROFILE BAR (Nura Top Bar) */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Input Pill */}
        <div className={`relative flex-1 max-w-xl flex items-center rounded-full border transition-all ${
          isDark 
            ? 'bg-[#121826]/70 border-white/10 text-white focus-within:border-cyan-500/50 shadow-inner' 
            : 'bg-white/80 border-slate-200 text-slate-800 focus-within:border-cyan-500 shadow-sm'
        }`}>
          <Search className={`w-4 h-4 ml-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search systems, signatures, trade routes, fleet pilots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-xs focus:outline-none placeholder-slate-400 font-medium"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button 
            className={`p-2 rounded-full border transition-colors ${
              isDark 
                ? 'bg-[#121826]/70 border-white/10 text-slate-300 hover:text-white' 
                : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
            }`}
            title="Fleet Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <div className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border ${
            isDark 
              ? 'bg-[#121826]/70 border-white/10 text-white' 
              : 'bg-white/80 border-slate-200 text-slate-800 shadow-sm'
          }`}>
            {currentPilot ? (
              <img 
                src={currentPilot.avatarUrl} 
                alt={currentPilot.characterName} 
                className="w-6 h-6 rounded-full object-cover border border-cyan-400/50" 
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
              </div>
            )}
            <span className="text-xs font-semibold">{pilotDisplayName}</span>
          </div>
        </div>
      </div>

      {/* 2. GREETING HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {getGreeting()}, <span className="text-cyan-500">{pilotDisplayName}</span>
          </h1>
          <p className={`text-sm mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Here's your fleet recon and wormhole expedition summary for today.
          </p>
        </div>

        {/* Direct Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('mapper')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs shadow-md transition-all"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Launch Chain Mapper</span>
            <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* 3. NURA-STYLE METRIC SUMMARY ROW (Exact Nura Proportions) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Heart Rate / Systems Mapped */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
            : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Chain Systems
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Normal
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalSystems}
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              SYS
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalConnections} Active wormhole links
          </p>
        </div>

        {/* Metric 2: Sleep Score / Fleet Readiness */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
            : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Fleet Readiness
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Excellent
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              94
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              %
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Tranquility latency: 12ms
          </p>
        </div>

        {/* Metric 3: Step Target / Signatures Scanned */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
            : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Signatures
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              84%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.max(totalSignatures, 38)}
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              SIGS
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Target: 45 signatures mapped
          </p>
        </div>

        {/* Metric 4: Stress Score / Threat Level */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
            : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Threat Index
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Low
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              21
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              %
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Quiet zKillboard activity
          </p>
        </div>
      </div>

      {/* 4. ACTIVITY TIMELINE PILLS (Matching Nura's horizontal milestone capsules) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {timelinePills.map((pill, idx) => (
          <div
            key={idx}
            className={`px-3 py-1.5 rounded-full border text-xs flex items-center gap-2 shrink-0 transition-colors ${
              isDark 
                ? 'bg-[#101626]/60 border-white/5 text-slate-300' 
                : 'bg-slate-100/90 border-slate-200 text-slate-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="font-semibold text-[11px] opacity-75">{pill.label}</span>
            <span className="font-medium text-[11px]">{pill.text}</span>
          </div>
        ))}
      </div>

      {/* 5. MAIN NURA CARDS GRID (Left 2 cols: Trend & 3D Constellation; Right 1 col: AI Insights & Scores) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card A: Heart Rate Trend / Fleet Jumps & Navigation Wave Chart */}
          <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
            isDark 
              ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
              : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Fleet Navigation &amp; Jump Flow
                </h3>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Hourly jump velocity across known space and wormholes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  41% faster transit
                </span>
                <button
                  onClick={() => onNavigateTab('mapper')}
                  className={`p-1.5 rounded-full border transition-colors ${
                    isDark ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                  title="Expand Full Mapper"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smooth SVG Area Curve Chart (Matching Nura's Heart Rate curve) */}
            <div className="relative w-full h-36 my-2">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 120">
                <defs>
                  <linearGradient id="nura-chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area Fill */}
                <path
                  d="M 0 100 Q 80 40, 160 85 T 320 30 T 480 65 T 600 20 L 600 120 L 0 120 Z"
                  fill="url(#nura-chart-gradient)"
                />
                {/* Smooth Curve Stroke */}
                <path
                  d="M 0 100 Q 80 40, 160 85 T 320 30 T 480 65 T 600 20"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Peak Indicator Dot */}
                <circle cx="320" cy="30" r="4.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Footer Metrics (Resting / Max / Status) */}
            <div className={`grid grid-cols-3 gap-2 pt-3 border-t text-center ${
              isDark ? 'border-white/5' : 'border-slate-100'
            }`}>
              <div>
                <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Average
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  3.2 Jumps/hr
                </span>
              </div>
              <div>
                <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Peak Velocity
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  14 Jumps/hr
                </span>
              </div>
              <div>
                <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Chain Status
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Optimal
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Interactive 3D Hologram / Constellation Viewer */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
              : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Interactive 3D Constellation Hologram
                </h3>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Spatial orbital map of all jumped systems. Drag to rotate, scroll to zoom.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/50 dark:bg-black/40 border border-slate-300/40 dark:border-white/5">
                <button
                  onClick={() => setActiveViewerMode('3d')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                    activeViewerMode === '3d'
                      ? 'bg-white dark:bg-cyan-500/20 text-slate-900 dark:text-cyan-300 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  3D Hologram
                </button>
                <button
                  onClick={() => onNavigateTab('mapper')}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  2D Tree
                </button>
              </div>
            </div>

            {/* 3D Viewer Container */}
            <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-cyan-500/15 bg-black/40">
              <Hologram3DViewer
                systems={mapState.systems}
                connections={mapState.connections}
                activeSystemId={activeSystem?.id || 'J103955'}
                theme={theme}
                onSelectSystem={() => onNavigateTab('mapper')}
              />
            </div>
          </div>

        </div>

        {/* Right Column (1 Col: AI Insights, Health Score, Biomarkers, Timers) */}
        <div className="space-y-6">
          
          {/* Card 1: AI Insights with Glossy 3D Orb (Matching Nura AI Insights) */}
          <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
            isDark 
              ? 'bg-gradient-to-br from-[#101b22] via-[#0e1624] to-[#0a101d] border-emerald-500/30 shadow-lg' 
              : 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border-emerald-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                AI Tactical Insights
              </span>

              {/* Glossy 3D Green Pearl / Orb Graphic (from Nura reference) */}
              <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-400 to-white shadow-[0_0_16px_rgba(16,185,129,0.7)] animate-pulse" />
            </div>

            <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Your wormhole network in <strong>{activeSystem?.name || 'J103955'}</strong> maintains an active static connection. 
              The trade route to <strong>Jita 4-4</strong> is <strong>4 jumps</strong> via Uemisaisen. Scout consistency improved by 14% this session.
            </p>

            <div className={`mt-4 pt-3 border-t text-[11px] font-sans flex items-center justify-between ${
              isDark ? 'border-emerald-500/20 text-emerald-400' : 'border-emerald-200 text-emerald-700 font-semibold'
            }`}>
              <span>• Hostiles on Scan: 0</span>
              <span>• Mass: Stable</span>
            </div>
          </div>

          {/* Card 2: Health Score (Exact Nura proportions: 94 / 100, Excellent pill) */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
              : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Expedition Score
              </span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="text-center py-2">
              <div className={`text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                94
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                100 Max Score
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Excellent
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Biomarker Overview / Chain Structure Overview */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
              : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Chain Gateways Overview
              </span>
              <button 
                onClick={() => onNavigateTab('mapper')}
                className={`text-slate-400 hover:text-cyan-400 transition-colors`}
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                  Highsec Connections
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Normal (4)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                  Lowsec Gateways
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Normal (2)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                  C1 - C3 Wormholes
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Active (7)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                  C4 - C6 Deep WH
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  High Class (5)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                  Hostile Bubbles / Camps
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Clear (0)
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Upcoming Structure Timers (Matching Nura Upcoming card) */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#101626]/80 border-white/10 shadow-lg' 
              : 'bg-white/80 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Upcoming Structure Timers
              </span>
              <button
                onClick={() => setIsTimerModalOpen(true)}
                className="p-1 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                title="Create Structure Timer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {timersList.length === 0 ? (
              <div className={`text-xs text-center py-4 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No upcoming timers recorded. Click + to add one.
              </div>
            ) : (
              <div className="space-y-2.5">
                {timersList.slice(0, 3).map((timer) => (
                  <div 
                    key={timer.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {timer.name}
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {timer.systemName} • {timer.structureType} ({timer.timerType})
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-400">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Structure Timer Modal */}
      <StructureTimerModal
        isOpen={isTimerModalOpen}
        defaultSystem={activeSystem?.name || 'J103955'}
        availableSystems={Object.keys(mapState.systems)}
        onClose={() => setIsTimerModalOpen(false)}
      />

    </div>
  );
};
