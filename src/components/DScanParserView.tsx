import React, { useState, useMemo, useEffect } from 'react';
import { 
  Radar, Copy, Check, Trash2, Filter, Search, Shield, AlertTriangle, 
  Share2, ChevronDown, ChevronRight, Compass, Crosshair, Sparkles, Terminal,
  Radio, Network, ArrowRight
} from 'lucide-react';
import { parseDScan, generateDiscordReport } from '../services/dscanParser';
import { DScanReport, ThreatLevel } from '../types/dscan';
import { ThreatAlertBanner } from './ThreatAlertBanner';
import { identifyWormholeCode, WormholeCodeInfo } from '../data/wormholeTypesDatabase';
import { mapperService } from '../services/mapperService';
import { scoutWatcher } from '../services/scoutWatcher';

interface DScanParserViewProps {
  onScanAnalyzed?: (report: DScanReport) => void;
}

export const DScanParserView: React.FC<DScanParserViewProps> = ({ onScanAnalyzed }) => {
  // Starts completely clean - zero fake data
  const [inputText, setInputText] = useState<string>('');
  const [report, setReport] = useState<DScanReport | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number>(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [syncedWhCodes, setSyncedWhCodes] = useState<Record<string, boolean>>({});

  // Auto-update from Windows OS background clipboard listener (no tabbing out needed!)
  useEffect(() => {
    const unsub = scoutWatcher.onClipboardText((text) => {
      setInputText(text);
      handleParse(text);
    });
    return () => unsub();
  }, []);

  const handleParse = (textToParse: string) => {
    if (!textToParse.trim()) {
      setReport(null);
      return;
    }
    const result = parseDScan(textToParse);
    setReport(result);
    if (onScanAnalyzed) onScanAnalyzed(result);
  };

  const handleCopyDiscord = async () => {
    if (!report) return;
    const discordText = generateDiscordReport(report);
    await navigator.clipboard.writeText(discordText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleGroup = (role: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  // Filter items
  const filteredItems = useMemo(() => {
    if (!report) return [];

    return report.items.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.itemName.toLowerCase().includes(q);
        const matchesType = item.itemType.toLowerCase().includes(q);
        const matchesRole = item.shipInfo.role.toLowerCase().includes(q);
        if (!matchesName && !matchesType && !matchesRole) return false;
      }

      if (selectedFilter === 'capitals') {
        if (item.shipInfo.group !== 'Capital Ship') return false;
      } else if (selectedFilter === 'bubbles') {
        if (!item.shipInfo.isBubbler && item.shipInfo.role !== 'Interdiction Bubble') return false;
      } else if (selectedFilter === 'recons') {
        if (item.shipInfo.role !== 'Combat Recon' && item.shipInfo.role !== 'Force Recon') return false;
      } else if (selectedFilter === 'tackle') {
        if (item.shipInfo.role !== 'Interceptor' && item.shipInfo.role !== 'Interdictor (Dictor)' && item.shipInfo.role !== 'Heavy Interdictor (HIC)') return false;
      } else if (selectedFilter === 'battleships') {
        if (item.shipInfo.role !== 'Battleship' && item.shipInfo.role !== 'Marauder' && item.shipInfo.role !== 'Black Ops') return false;
      } else if (selectedFilter === 'cruisers') {
        if (!item.shipInfo.role.includes('Cruiser')) return false;
      }

      if (maxDistanceFilter > 0) {
        if (item.distanceMeters > maxDistanceFilter) return false;
      }

      return true;
    });
  }, [report, searchQuery, selectedFilter, maxDistanceFilter]);

  const filteredGrouped = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    for (const item of filteredItems) {
      const role = item.shipInfo.role;
      if (!groups[role]) groups[role] = [];
      groups[role].push(item);
    }
    return groups;
  }, [filteredItems]);

  const threatColor = (level: ThreatLevel) => {
    switch (level) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/40';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/40';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/40';
      case 'low':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40';
      case 'structure':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/40';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner for active threats */}
      <ThreatAlertBanner report={report} />

      {/* Input / Scanner Console */}
      <div className="bg-[#0f1422] border border-cyan-900/40 rounded-xl p-5 shadow-xl relative overflow-hidden font-mono">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                DIRECTIONAL SCAN INGEST
                <span className="text-[11px] font-normal text-cyan-400/80 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                  CTRL+A, CTRL+C from EVE Client
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Paste real scan output directly from your in-game Directional Scanner window
              </p>
            </div>
          </div>

          {report && (
            <button
              onClick={() => {
                setInputText('');
                setReport(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-red-400 border border-gray-800 flex items-center gap-1.5 transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Scan</span>
            </button>
          )}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleParse(e.target.value);
            }}
            placeholder="Paste real EVE Online D-Scan here (or copy in-game with AUTO-SCOUT: ON)..."
            rows={report ? 3 : 5}
            className="w-full bg-[#090d16] border border-gray-800 focus:border-cyan-500 rounded-lg p-3 text-xs text-cyan-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y"
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-800/60 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleParse(inputText)}
              disabled={!inputText.trim()}
              className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                inputText.trim()
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>PARSE SCAN</span>
            </button>
          </div>

          {report && (
            <button
              onClick={handleCopyDiscord}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border border-indigo-700/60 flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY DISCORD REPORT'}</span>
            </button>
          )}
        </div>
      </div>

      {/* When Empty: Clean Standby State */}
      {!report && (
        <div className="p-12 text-center bg-[#0a0e1a] border border-cyan-900/20 rounded-2xl font-mono">
          <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <Radar className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            STANDBY // AWAITING LIVE EVE DATA
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 font-sans leading-relaxed">
            In your EVE client, focus your <strong>Directional Scanner</strong>, press <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-cyan-300">Ctrl+A</kbd> then <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-cyan-300">Ctrl+C</kbd>, and paste it above.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[11px] text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Auto-Scout will automatically parse it the moment you copy
          </div>
        </div>
      )}

      {/* Main Analysis Section (Only rendered when real scan exists) */}
      {report && (
        <div className="space-y-6">
          {/* Wormhole Detection & Identification Card */}
          {report.wormholes && report.wormholes.length > 0 && (
            <div className="space-y-3 font-mono">
              {report.wormholes.map((whItem) => {
                const whInfo = identifyWormholeCode(whItem.itemName + ' ' + whItem.itemType + ' ' + whItem.rawLine);
                const isIdentified = whInfo && whInfo.code !== 'Unidentified Wormhole';
                const isK162 = whInfo?.isK162;

                return (
                  <div
                    key={whItem.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isK162
                        ? 'bg-gradient-to-r from-red-950/40 via-[#120d1c] to-[#0d121f] border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                        : 'bg-gradient-to-r from-indigo-950/40 via-[#101528] to-[#0d121f] border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isK162 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                        }`}>
                          <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                              {isIdentified ? 'WORMHOLE IDENTIFIED ON GRID' : 'WORMHOLE DETECTED ON D-SCAN'}
                            </span>
                            <span className="font-bold text-amber-400 text-xs">
                              {whItem.distanceStr}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                            {isIdentified ? (
                              <>
                                <span className={isK162 ? 'text-red-400 font-extrabold' : 'text-indigo-300'}>
                                  {whInfo?.code}
                                </span>
                                <span className="text-xs font-normal text-gray-400">
                                  ({whInfo?.destination})
                                </span>
                              </>
                            ) : (
                              <span>Wormhole Signature</span>
                            )}
                          </h3>

                          <p className="text-xs text-gray-300 mt-1 font-sans">
                            {whInfo?.tacticalNote}
                          </p>
                          
                          {isIdentified && (
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400 font-sans">
                              <span>Max Ship: <strong className="text-white">{whInfo?.maxShipSize}</strong></span>
                              <span>Total Mass: <strong className="text-white">{whInfo?.totalMassCapacity}</strong></span>
                              <span>Life: <strong className="text-white">~{whInfo?.lifetimeHours}h</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const activeSys = mapperService.getActiveSystem()?.id || 'Current System';
                          const targetName = isIdentified ? `${whInfo?.code} (${whInfo?.destination.split(' ')[0]})` : 'Unknown Wormhole';
                          mapperService.addWormholeConnection(activeSys, targetName, whInfo?.code || 'Wormhole');
                          setSyncedWhCodes(prev => ({ ...prev, [whItem.id]: true }));
                        }}
                        className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 text-xs transition-all whitespace-nowrap ${
                          syncedWhCodes[whItem.id]
                            ? 'bg-green-950 text-green-300 border border-green-800'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                        }`}
                      >
                        {syncedWhCodes[whItem.id] ? <Check className="w-4 h-4 text-green-400" /> : <Network className="w-4 h-4" />}
                        <span>{syncedWhCodes[whItem.id] ? 'LINKED TO MAPPER!' : 'LINK TO CHAIN MAP'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
            <div className="bg-[#0f1422] border border-cyan-900/30 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total On Scan</div>
              <div className="text-2xl font-bold text-white mt-1">{report.totalItems}</div>
              <div className="text-[10px] text-cyan-400 mt-0.5">{report.uniqueShipsCount} unique types</div>
            </div>

            <div className={`border rounded-xl p-3 ${threatColor(report.maxThreat)}`}>
              <div className="text-[10px] uppercase tracking-wider opacity-80">Threat Status</div>
              <div className="text-2xl font-bold uppercase mt-1">{report.maxThreat}</div>
              <div className="text-[10px] opacity-80 mt-0.5">Danger Rating</div>
            </div>

            <div className="bg-[#0f1422] border border-red-900/40 rounded-xl p-3">
              <div className="text-[10px] text-red-400 uppercase tracking-wider">Warp Disruptors</div>
              <div className="text-2xl font-bold text-red-300 mt-1">{report.bubbles.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Bubbles / Dictors</div>
            </div>

            <div className="bg-[#0f1422] border border-amber-900/40 rounded-xl p-3">
              <div className="text-[10px] text-amber-400 uppercase tracking-wider">Capitals</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{report.capitals.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Dreads / FAX / Titans</div>
            </div>

            <div className="bg-[#0f1422] border border-purple-900/40 rounded-xl p-3">
              <div className="text-[10px] text-purple-400 uppercase tracking-wider">Combat Recons</div>
              <div className="text-2xl font-bold text-purple-300 mt-1">{report.recons.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Cyno / Jammer / Neut</div>
            </div>

            <div className="bg-[#0f1422] border border-orange-900/40 rounded-xl p-3">
              <div className="text-[10px] text-orange-400 uppercase tracking-wider">Fast Tackle</div>
              <div className="text-2xl font-bold text-orange-300 mt-1">{report.tacklers.length}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Ceptors / HICs</div>
            </div>
          </div>

          {/* Filtering and Search Toolbar */}
          <div className="bg-[#0f1422] border border-gray-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 font-mono">
              <span className="text-gray-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>
              {[
                { id: 'all', label: `All (${report.totalItems})` },
                { id: 'capitals', label: `Capitals (${report.capitals.length})` },
                { id: 'bubbles', label: `Bubbles (${report.bubbles.length})` },
                { id: 'recons', label: `Recons (${report.recons.length})` },
                { id: 'tackle', label: `Tackle (${report.tacklers.length})` },
                { id: 'battleships', label: `Battleships` },
                { id: 'cruisers', label: `Cruisers` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    selectedFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-black/40 text-gray-400 hover:text-gray-200 border border-gray-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Distance Filter & Search */}
            <div className="flex items-center gap-2">
              <select
                value={maxDistanceFilter}
                onChange={(e) => setMaxDistanceFilter(Number(e.target.value))}
                aria-label="Filter items by distance range"
                className="bg-black/60 border border-gray-800 rounded px-2.5 py-1 text-gray-300 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value={0}>Any Distance</option>
                <option value={1000 * 1000}>&lt; 1,000 km (On Grid)</option>
                <option value={149597870700}>&lt; 1 AU (Immediate Warp)</option>
                <option value={149597870700 * 5}>&lt; 5 AU (Nearby)</option>
                <option value={149597870700 * 14.3}>&lt; 14.3 AU (Max D-Scan)</option>
              </select>

              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ship or name..."
                  className="w-full bg-black/60 border border-gray-800 focus:border-cyan-500 rounded pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Grouped Ship Hull Cards */}
          <div className="space-y-4">
            {Object.keys(filteredGrouped).length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-[#0f1422] border border-gray-800 rounded-xl font-mono text-sm">
                No items match the current filter or search criteria.
              </div>
            ) : (
              Object.entries(filteredGrouped).map(([role, items]) => {
                const sampleShip = items[0]?.shipInfo;
                const isCollapsed = collapsedGroups[role];

                return (
                  <div
                    key={role}
                    className="bg-[#0f1422] border border-gray-800/80 rounded-xl overflow-hidden shadow-lg transition-all"
                  >
                    <button
                      onClick={() => toggleGroup(role)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#141b2e] to-[#0f1422] flex items-center justify-between border-b border-gray-800/60 hover:bg-[#182138] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cyan-400" />
                        )}
                        <span className="font-mono font-bold text-white text-sm tracking-wide">
                          {role}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                          {items.length} detected
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sampleShip?.threatReason && (
                          <span className="hidden sm:inline-block text-[11px] font-mono text-amber-400/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
                            {sampleShip.threatReason}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${threatColor(
                            sampleShip?.threatLevel || 'neutral'
                          )}`}
                        >
                          {sampleShip?.threatLevel || 'neutral'}
                        </span>
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg bg-[#0a0e18] border transition-all hover:border-cyan-500/50 flex items-center gap-3 ${
                              item.shipInfo.threatLevel === 'critical'
                                ? 'border-red-900/60 bg-red-950/10'
                                : 'border-gray-800/80'
                            }`}
                          >
                            <div className="relative w-12 h-12 rounded bg-black/60 border border-gray-800 shrink-0 overflow-hidden flex items-center justify-center">
                              {item.shipInfo.typeId ? (
                                <img
                                  src={`https://images.evetech.net/types/${item.shipInfo.typeId}/render?size=64`}
                                  alt={item.itemType}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://images.evetech.net/types/${item.shipInfo.typeId}/icon?size=64`;
                                  }}
                                />
                              ) : (
                                <Crosshair className="w-5 h-5 text-gray-600" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-medium text-xs text-white truncate" title={item.itemName}>
                                  {item.itemName}
                                </span>
                                <span className="font-mono text-xs font-bold text-amber-400 whitespace-nowrap">
                                  {item.distanceStr}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1 mt-0.5">
                                <span className="text-[11px] font-mono text-cyan-400 truncate">
                                  {item.itemType}
                                </span>
                                {item.shipInfo.isCynoCapable && (
                                  <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-950 px-1 rounded border border-purple-800">
                                    CYNO
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
