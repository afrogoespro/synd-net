import React, { useState, useEffect } from 'react';
import { 
  Network, Compass, Building2, Users, Plus, Trash2, Copy, 
  Check, ExternalLink, Share2, Sparkles, RefreshCw, Radio, ArrowRight,
  User, MapPin
} from 'lucide-react';
import { mapperService } from '../services/mapperService';
import { ChainMapState, WormholeNode } from '../types/mapper';

export const ChainMapperView: React.FC = () => {
  const [mapState, setMapState] = useState<ChainMapState>(mapperService.getState());
  const [selectedSystemId, setSelectedSystemId] = useState<string>('Jita');
  const [newSystemInput, setNewSystemInput] = useState<string>('');
  const [whTypeInput, setWhTypeInput] = useState<string>('K162');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [currentPilotName, setCurrentPilotName] = useState<string>(() => {
    return localStorage.getItem('synd_pilot_name') || 'Syndra en Tilavine';
  });

  useEffect(() => {
    const unsubscribe = mapperService.subscribe((state) => {
      setMapState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  const selectedSystem: WormholeNode | undefined = 
    mapState.systems[selectedSystemId] || Object.values(mapState.systems)[0];

  const handleAddConnection = async () => {
    if (!newSystemInput.trim()) return;
    await mapperService.addWormholeConnection(
      selectedSystem?.id || 'Jita',
      newSystemInput.trim(),
      whTypeInput.trim()
    );
    setSelectedSystemId(newSystemInput.trim().toUpperCase());
    setNewSystemInput('');
  };

  const handleCopyBuddyLink = async () => {
    // Current host or LAN address
    const url = window.location.origin;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const classBadgeColor = (sysClass: string) => {
    switch (sysClass) {
      case 'C5':
      case 'C6':
        return 'bg-red-950 text-red-300 border-red-800';
      case 'C4':
      case 'C3':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'C2':
      case 'C1':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'Highsec':
        return 'bg-green-950 text-green-300 border-green-800';
      case 'Lowsec':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      default:
        return 'bg-purple-950 text-purple-300 border-purple-800';
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Multi-User Buddy Sync Status */}
      <div className="bg-[#0f1422] border border-cyan-900/40 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                WORMHOLE CHAIN MAPPER
              </h2>
              <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-950/80 px-2 py-0.5 rounded border border-green-800/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                BUDDY SYNC ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Live multi-user chain map. When you or your buddy scan structures or jump, it updates instantly on both screens.
            </p>
          </div>
        </div>

        {/* Share with Buddy button */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleCopyBuddyLink}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            title="Share this URL with your fleet buddy"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'BUDDY LINK COPIED!' : 'SHARE LINK WITH BUDDY'}</span>
          </button>

          <button
            onClick={() => mapperService.clearMap()}
            className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-500 hover:text-red-400 border border-gray-800 transition-colors"
            title="Reset Chain Map"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Chain Visualizer & System Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Visual Chain Map Graph */}
        <div className="lg:col-span-2 bg-[#0a0e1a] border border-cyan-900/30 rounded-2xl p-6 shadow-2xl relative min-h-[460px] flex flex-col justify-between overflow-hidden">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-gray-800/80 text-xs">
              <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase">
                <Compass className="w-4 h-4 text-cyan-400" />
                Active Wormhole Chain ({Object.keys(mapState.systems).length} Systems)
              </span>
              <span className="text-[11px] text-cyan-400/80">
                Click any node to inspect scanned structures
              </span>
            </div>

            {/* Systems Flow Tree */}
            <div className="flex flex-wrap items-center gap-4 relative z-10 py-4">
              {Object.values(mapState.systems).map((sys, idx) => {
                const isSelected = sys.id === selectedSystem?.id;
                const structCount = sys.structures.length;

                return (
                  <React.Fragment key={sys.id}>
                    {/* Node Card */}
                    <button
                      onClick={() => setSelectedSystemId(sys.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#12192c] to-[#0c1220] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-105'
                          : 'bg-[#0e1424]/90 border-gray-800 hover:border-cyan-600/50 hover:bg-[#131b30]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="font-bold text-base text-white tracking-wide">
                          {sys.name}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${classBadgeColor(sys.systemClass)}`}>
                          {sys.systemClass}
                        </span>
                      </div>

                      {/* Structure badge */}
                      <div className="flex items-center gap-2 text-xs mt-2">
                        <span className={`flex items-center gap-1 text-[11px] font-semibold ${
                          structCount > 0 ? 'text-amber-400' : 'text-gray-500'
                        }`}>
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{structCount} {structCount === 1 ? 'Structure' : 'Structures'}</span>
                        </span>
                      </div>

                      {/* Active Pilots in this system */}
                      {sys.activePilots && sys.activePilots.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2.5 pt-2 border-t border-gray-800/60">
                          {sys.activePilots.map((p, pIdx) => {
                            const isYou = p.includes('(You)');
                            return (
                              <span
                                key={pIdx}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                                  isYou
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                }`}
                              >
                                <User className="w-2.5 h-2.5" />
                                <span>{p}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="text-[10px] text-gray-500 mt-1.5">
                        Updated {sys.lastUpdated}
                      </div>
                    </button>

                    {/* Arrow Connection to next node */}
                    {idx < Object.values(mapState.systems).length - 1 && (
                      <div className="flex flex-col items-center justify-center text-gray-600">
                        <span className="text-[10px] font-bold text-cyan-500/80 mb-0.5">WH</span>
                        <ArrowRight className="w-5 h-5 text-cyan-500/60 animate-pulse" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Quick Connect / Branch New Wormhole Bar */}
          <div className="mt-6 pt-4 border-t border-gray-800/80 flex flex-wrap items-center gap-3 relative z-10 text-xs">
            <span className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1">
              <Plus className="w-4 h-4 text-cyan-400" />
              Link New Wormhole from {selectedSystem?.name || 'Selected'}:
            </span>
            <input
              type="text"
              value={newSystemInput}
              onChange={(e) => setNewSystemInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddConnection()}
              placeholder="e.g. J152438 or Amamake"
              className="bg-black/60 border border-gray-800 focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
            />
            <input
              type="text"
              value={whTypeInput}
              onChange={(e) => setWhTypeInput(e.target.value)}
              placeholder="Wormhole (e.g. K162, H296)"
              className="bg-black/60 border border-gray-800 focus:border-cyan-500 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none w-28"
            />
            <button
              onClick={handleAddConnection}
              disabled={!newSystemInput.trim()}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-black font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
            >
              Add to Chain
            </button>
          </div>
        </div>

        {/* Right Col: Selected System Inspector & Real Scanned Structures */}
        <div className="bg-[#0f1422] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                  SYSTEM INSPECTOR
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  {selectedSystem?.name}
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${classBadgeColor(selectedSystem?.systemClass || 'Unknown')}`}>
                    {selectedSystem?.systemClass}
                  </span>
                </h3>
              </div>

              <a
                href={`https://zkillboard.com/system/${selectedSystem?.name}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-900 hover:bg-cyan-950 text-gray-400 hover:text-cyan-300 border border-gray-800 transition-colors"
                title="View System on zKillboard"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Fleet Member Location Control */}
            <div className="bg-[#090d16] border border-cyan-900/40 rounded-xl p-3 mb-4 text-xs">
              <div className="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-cyan-400 font-mono">
                  <MapPin className="w-3.5 h-3.5" />
                  Fleet Pilot Location
                </span>
                <span className="text-[10px] text-gray-500">
                  {selectedSystem?.activePilots?.length || 0} Pilot(s) in system
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentPilotName}
                  onChange={(e) => {
                    setCurrentPilotName(e.target.value);
                    localStorage.setItem('synd_pilot_name', e.target.value);
                  }}
                  placeholder="Pilot Name (e.g. Syndra)"
                  className="bg-black/80 border border-gray-800 focus:border-cyan-500 rounded px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none flex-1 font-mono"
                />
                <button
                  onClick={() => {
                    if (selectedSystem) {
                      mapperService.setPilotLocation(currentPilotName, selectedSystem.id);
                    }
                  }}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] whitespace-nowrap"
                  title="Move your pilot marker to this system"
                >
                  <MapPin className="w-3 h-3" />
                  <span>I'M HERE</span>
                </button>
              </div>

              {selectedSystem?.activePilots && selectedSystem.activePilots.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-800/60">
                  {selectedSystem.activePilots.map((p, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-cyan-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Scanned Structures on Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Scanned Structures ({selectedSystem?.structures.length || 0})
                </span>
              </div>

              {(!selectedSystem?.structures || selectedSystem.structures.length === 0) ? (
                <div className="p-6 text-center text-gray-500 bg-[#090d16] border border-gray-800/80 rounded-xl text-xs font-sans">
                  No structures scanned yet. When you or your buddy paste a D-Scan with an Astrahus, Fortizar, or Athanor, it will instantly appear here!
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {selectedSystem.structures.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg bg-[#090d16] border border-gray-800 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span className="font-bold text-white">{s.type}</span>
                        </div>
                        <div className="text-gray-400 text-[11px] font-sans truncate max-w-[180px]">
                          "{s.name}"
                        </div>
                        <div className="text-[10px] text-cyan-400/80 mt-0.5">
                          Scouted by {s.scoutedBy} ({s.timestamp})
                        </div>
                      </div>

                      <span className="font-bold text-amber-300 text-xs whitespace-nowrap">
                        {s.distance}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-500 font-sans">
            💡 <strong>Pro Tip:</strong> Open your D-scan window in-game, hit <kbd className="px-1 py-0.5 rounded bg-gray-800 text-cyan-300">Ctrl+A</kbd>, <kbd className="px-1 py-0.5 rounded bg-gray-800 text-cyan-300">Ctrl+C</kbd> to automatically populate structures on this shared map!
          </div>
        </div>
      </div>
    </div>
  );
};
