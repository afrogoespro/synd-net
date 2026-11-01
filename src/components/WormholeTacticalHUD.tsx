import React, { useState, useEffect } from 'react';
import { 
  Radio, Compass, ShieldAlert, Sparkles, AlertTriangle, 
  Flame, Crosshair, ChevronDown, ChevronUp, X, Pickaxe, ExternalLink, Zap
} from 'lucide-react';
import { WormholeSystemInfo, getWormholeSystemMetadata } from '../data/wormholeDatabase';
import { fetchLiveSystemKills } from '../services/zkillService';
import { KillmailItem } from '../types/killmail';

interface WormholeTacticalHUDProps {
  systemName: string;
  onNavigateTab: (tab: 'dscan' | 'mapper' | 'ore' | 'killfeed') => void;
  onDismiss?: () => void;
  onLogSignature?: () => void;
}

export const WormholeTacticalHUD: React.FC<WormholeTacticalHUDProps> = ({
  systemName,
  onNavigateTab,
  onDismiss,
  onLogSignature
}) => {
  const [meta, setMeta] = useState<WormholeSystemInfo>(getWormholeSystemMetadata(systemName));
  const [expanded, setExpanded] = useState<boolean>(true);
  const [threatLevel, setThreatLevel] = useState<'Quiet' | 'Low Risk' | 'Active Hunters' | 'Extreme Danger'>('Quiet');
  const [totalKills24h, setTotalKills24h] = useState<number>(0);
  const [recentKills, setRecentKills] = useState<KillmailItem[]>([]);
  const [loadingKills, setLoadingKills] = useState<boolean>(false);

  useEffect(() => {
    const newMeta = getWormholeSystemMetadata(systemName);
    setMeta(newMeta);

    // Fetch live zKillboard kills for this specific system
    if (systemName.startsWith('J')) {
      setLoadingKills(true);
      fetchLiveSystemKills(systemName, 3).then((res) => {
        setThreatLevel(res.threatLevel);
        setTotalKills24h(res.totalKills24h);
        setRecentKills(res.kills);
        setLoadingKills(false);
      });
    }
  }, [systemName]);

  if (!systemName.startsWith('J')) {
    return null;
  }

  const threatColor = () => {
    switch (threatLevel) {
      case 'Extreme Danger':
        return 'bg-red-500/20 text-red-300 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
      case 'Active Hunters':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.4)]';
      case 'Low Risk':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="mb-6 rounded-2xl border-2 border-cyan-500/60 bg-gradient-to-r from-[#0b1220] via-[#080d18] to-[#0b1220] p-4 shadow-[0_0_35px_rgba(6,182,212,0.25)] font-mono text-xs transition-all relative overflow-hidden">
      {/* Background Subtle Space Glow */}
      <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>

      {/* Main HUD Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                TACTICAL J-SPACE ENTRY INTEL
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-600/60 text-cyan-200">
                LIVE
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2.5 mt-0.5">
              <span>{meta.systemName}</span>
              <span className="text-sm px-2 py-0.5 rounded border border-cyan-500/60 bg-cyan-500/20 text-cyan-300 font-bold">
                {meta.wormholeClass} Wormhole
              </span>
              {meta.bookmarkCode && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-300 font-mono">
                  [{meta.bookmarkCode}]
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Quick Threat & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onLogSignature && (
            <button
              onClick={onLogSignature}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/60 text-cyan-200 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
              title="Record or update the signature ID you jumped through"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>LOG SIG</span>
            </button>
          )}

          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold ${threatColor()}`}>
            <Flame className="w-3.5 h-3.5" />
            <span>THREAT: {threatLevel.toUpperCase()}</span>
            <span className="text-[10px] opacity-80">({totalKills24h} kills in 24h)</span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-colors"
            title={expanded ? 'Collapse HUD' : 'Expand HUD'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg bg-gray-900 hover:bg-red-950/80 text-gray-400 hover:text-red-300 border border-gray-800 transition-colors"
              title="Dismiss HUD"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Tactical Cards */}
      {expanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Statics & Exit Routes */}
          <div className="p-3.5 rounded-xl bg-[#060a12] border border-cyan-900/50 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5 mb-1.5">
                <Compass className="w-3.5 h-3.5" />
                Guaranteed Static Connections
              </div>
              <div className="text-sm font-bold text-white flex flex-wrap gap-1.5">
                {meta.statics.map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-200">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-sans">
                Permanent wormhole links spawn continuously in this system. Scan for these exit signatures to route back to empire or deeper J-space.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('mapper')}
              className="mt-3 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono underline"
            >
              <span>View Chain in Mapper &rarr;</span>
            </button>
          </div>

          {/* Card 2: Environmental Effect & Combat Modifiers */}
          <div className="p-3.5 rounded-xl bg-[#060a12] border border-indigo-900/50 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                System Effect &amp; Physics
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded border ${
                  meta.effect === 'No Effect' 
                    ? 'bg-gray-900 text-gray-300 border-gray-700' 
                    : 'bg-purple-950 text-purple-200 border-purple-600'
                }`}>
                  {meta.effect || 'Standard System'}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-2 font-sans font-semibold">
                {meta.effectDescription || 'Standard physics (no hull/weapon modifiers).'}
              </p>
            </div>

            <div className="mt-3 text-[10px] text-gray-500 font-mono">
              Class: {meta.wormholeClass} // Sec: {meta.securityStatus || '-0.99'}
            </div>
          </div>

          {/* Card 3: Live Combat Threat & Top Ore/Gas */}
          <div className="p-3.5 rounded-xl bg-[#060a12] border border-amber-900/50 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Pickaxe className="w-3.5 h-3.5" />
                  High-Value Resources
                </span>
                <span className="text-[10px] text-gray-500 font-mono">Top ISK/m³</span>
              </div>

              <div className="space-y-1.5">
                {meta.topGasSites?.slice(0, 1).map((g, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    ⛽ {g}
                  </div>
                ))}
                {meta.topOreSites?.slice(0, 1).map((o, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                    💎 {o}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-800">
              <button
                onClick={() => onNavigateTab('ore')}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-mono underline"
              >
                Scan Ore &amp; Gas Sites &rarr;
              </button>
              <button
                onClick={() => onNavigateTab('killfeed')}
                className="text-[11px] text-red-400 hover:text-red-300 font-mono underline"
              >
                Inspect Kills &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
