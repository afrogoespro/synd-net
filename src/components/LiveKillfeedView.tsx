import React, { useState, useEffect } from 'react';
import { Flame, ExternalLink, RefreshCw, Filter, Zap, Radio } from 'lucide-react';
import { KillmailItem } from '../types/killmail';
import { fetchLiveRecentKills } from '../services/zkillService';

export const LiveKillfeedView: React.FC = () => {
  const [kills, setKills] = useState<KillmailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [spaceFilter, setSpaceFilter] = useState<'all' | 'lowsec' | 'nullsec' | 'wspace'>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Load real kills from zKillboard API
  const refreshKills = async () => {
    setLoading(true);
    const liveKills = await fetchLiveRecentKills(20);
    if (liveKills.length > 0) {
      setKills(liveKills);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshKills();

    // Auto-poll every 12 seconds
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLiveRecentKills(20).then(data => {
          if (data.length > 0) {
            setKills(data);
          }
        });
      }, 12000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Format ISK
  const formatIsk = (val: number): string => {
    if (val >= 1000000000) {
      return `${(val / 1000000000).toFixed(2)}B ISK`;
    }
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M ISK`;
    }
    return `${val.toLocaleString()} ISK`;
  };

  const filteredKills = kills.filter(k => {
    if (spaceFilter === 'lowsec') {
      return k.solarSystemSecurity > 0.0 && k.solarSystemSecurity < 0.5;
    }
    if (spaceFilter === 'nullsec') {
      return k.solarSystemSecurity <= 0.0 && k.regionName !== 'W-Space';
    }
    if (spaceFilter === 'wspace') {
      return k.regionName === 'W-Space' || k.solarSystemName.startsWith('J');
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#0f1422] border border-cyan-900/40 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-mono font-bold text-white tracking-wide flex items-center gap-2">
              REAL-TIME COMBAT FEED
              <span className="flex items-center gap-1 text-[11px] font-mono text-green-400 bg-green-950/80 px-2 py-0.5 rounded border border-green-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                LIVE ZKILLBOARD API
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Live ship destructions, capital kills, and skirmishes streaming directly from New Eden
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Refresh button */}
          <button
            onClick={refreshKills}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-900 hover:bg-cyan-950 text-gray-400 hover:text-cyan-300 border border-gray-800 transition-colors flex items-center gap-1.5"
            title="Refresh Live Kills"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Security space filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Space:
            </span>
            <button
              onClick={() => setSpaceFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                spaceFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-black/40 text-gray-400 border border-gray-800'
              }`}
            >
              All Space
            </button>
            <button
              onClick={() => setSpaceFilter('lowsec')}
              className={`px-2.5 py-1 rounded transition-colors ${
                spaceFilter === 'lowsec'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-black/40 text-gray-400 border border-gray-800'
              }`}
            >
              Lowsec
            </button>
            <button
              onClick={() => setSpaceFilter('nullsec')}
              className={`px-2.5 py-1 rounded transition-colors ${
                spaceFilter === 'nullsec'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                  : 'bg-black/40 text-gray-400 border border-gray-800'
              }`}
            >
              Nullsec
            </button>
            <button
              onClick={() => setSpaceFilter('wspace')}
              className={`px-2.5 py-1 rounded transition-colors ${
                spaceFilter === 'wspace'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                  : 'bg-black/40 text-gray-400 border border-gray-800'
              }`}
            >
              J-Space
            </button>
          </div>
        </div>
      </div>

      {/* Killfeed list */}
      <div className="space-y-3 font-mono">
        {loading && kills.length === 0 ? (
          <div className="p-8 text-center text-cyan-400 bg-[#0f1422] border border-gray-800 rounded-xl flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Fetching live killstream from zKillboard API...</span>
          </div>
        ) : filteredKills.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-[#0f1422] border border-gray-800 rounded-xl text-sm">
            No live kills match the selected space filter.
          </div>
        ) : (
          filteredKills.map((kill) => {
            const isHighValue = kill.totalValue >= 1000000000;
            return (
              <div
                key={kill.killmailId}
                className={`p-4 rounded-xl bg-[#0f1422] border transition-all hover:border-cyan-500/50 shadow-lg ${
                  kill.isCapital
                    ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-gradient-to-r from-red-950/20 via-[#0f1422] to-[#0f1422]'
                    : isHighValue
                    ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : 'border-gray-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Victim & Ship */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-14 rounded-lg bg-black/60 border border-gray-800 shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={`https://images.evetech.net/types/${kill.victim.shipTypeId}/render?size=64`}
                        alt={kill.victim.shipTypeName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.evetech.net/types/${kill.victim.shipTypeId}/icon?size=64`;
                        }}
                      />
                      {kill.isCapital && (
                        <span className="absolute bottom-0 inset-x-0 bg-red-600/90 text-white font-mono text-[8px] font-bold text-center py-0.5">
                          CAPITAL
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {kill.victim.shipTypeName}
                        </span>
                        <span className="text-xs text-gray-400">
                          lost by <span className="text-gray-200 font-semibold">{kill.victim.characterName}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-gray-400 font-sans">
                          {kill.victim.corporationName}
                        </span>
                        {kill.victim.allianceName && (
                          <span className="text-[11px] font-mono text-amber-400/90">
                            [{kill.victim.allianceName}]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kill location & Attacker */}
                  <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
                    {/* Final Blow Attacker */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase">Final Blow</span>
                      <span className="text-gray-200 font-semibold">
                        {kill.finalBlow.characterName}
                      </span>
                      <span className="text-[11px] text-cyan-400">
                        {kill.finalBlow.shipTypeName} ({kill.attackerCount} attackers)
                      </span>
                    </div>

                    {/* Solar system */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase">Solar System</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold">{kill.solarSystemName}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            kill.solarSystemSecurity <= 0
                              ? 'text-red-400 bg-red-950/80 border border-red-800/60'
                              : 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
                          }`}
                        >
                          {kill.solarSystemSecurity.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">{kill.regionName}</span>
                    </div>

                    {/* Loss ISK Value */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 uppercase">Destroyed Value</span>
                      <span
                        className={`text-sm font-bold ${
                          isHighValue ? 'text-amber-400' : 'text-gray-200'
                        }`}
                      >
                        {formatIsk(kill.totalValue)}
                      </span>
                      <span className="text-[10px] text-gray-500">{kill.killmailTime} EVE</span>
                    </div>

                    {/* zKill Link */}
                    <a
                      href={kill.zkillUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-900 hover:bg-cyan-950 text-gray-400 hover:text-cyan-300 border border-gray-800 hover:border-cyan-600 transition-colors"
                      title="View Killmail on zKillboard"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
