import React, { useState } from 'react';
import { 
  Users, Search, ShieldAlert, Radio, ExternalLink, 
  Trash2, Filter, AlertOctagon, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { parseLocalPilots, analyzeLocalPilots } from '../services/localScanner';
import { LocalIntelReport, PilotIntel } from '../types/intel';

export const LocalIntelView: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [report, setReport] = useState<LocalIntelReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterThreat, setFilterThreat] = useState<'all' | 'high' | 'cyno'>('all');

  const runAnalysis = async (text: string) => {
    const pilotNames = parseLocalPilots(text);
    if (pilotNames.length === 0) {
      setReport(null);
      return;
    }
    setLoading(true);
    const result = await analyzeLocalPilots(pilotNames);
    setReport(result);
    setLoading(false);
  };

  const filteredPilots = (report?.pilots || []).filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCorp = p.corporationName?.toLowerCase().includes(q);
      const matchAlliance = p.allianceName?.toLowerCase().includes(q);
      if (!matchName && !matchCorp && !matchAlliance) return false;
    }
    if (filterThreat === 'high' && !p.isHighThreat) return false;
    if (filterThreat === 'cyno' && !p.isCynoPilot) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Console Input */}
      <div className="bg-[#0f1422] border border-cyan-900/40 rounded-xl p-5 shadow-xl font-mono">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                LOCAL CHAT INTEL SCANNER
                <span className="text-[11px] font-normal text-cyan-400/80 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                  LIVE CCP ESI &amp; ZKILLBOARD
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Paste the real pilot roster from your Local chat window (<kbd className="px-1 py-0.5 rounded bg-gray-800 text-cyan-300">Ctrl+A</kbd>, <kbd className="px-1 py-0.5 rounded bg-gray-800 text-cyan-300">Ctrl+C</kbd>)
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
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste real pilot names from Local chat here...&#10;Pilot One&#10;Pilot Two"
            rows={report ? 3 : 5}
            className="w-full bg-[#090d16] border border-gray-800 focus:border-cyan-500 rounded-lg p-3 text-xs text-cyan-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y"
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/60 text-xs">
          <button
            onClick={() => runAnalysis(inputText)}
            disabled={!inputText.trim() || loading}
            className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
              inputText.trim() && !loading
                ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            <span>{loading ? 'QUERYING ESI & ZKILL...' : 'SCAN PILOTS'}</span>
          </button>

          {report && (
            <div className="text-gray-400 text-xs">
              Verified {report.totalPilots} pilots in system
            </div>
          )}
        </div>
      </div>

      {/* Standby State when empty */}
      {!report && !loading && (
        <div className="p-12 text-center bg-[#0a0e1a] border border-cyan-900/20 rounded-2xl font-mono">
          <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <Users className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            STANDBY // AWAITING LOCAL CHAT ROSTER
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 font-sans leading-relaxed">
            Click into your in-game <strong>Local Chat</strong> window, select all (<kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-cyan-300">Ctrl+A</kbd>), copy (<kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-cyan-300">Ctrl+C</kbd>), and paste above to fetch their real threat levels.
          </p>
        </div>
      )}

      {/* Metrics Row */}
      {report && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-[#0f1422] border border-cyan-900/30 rounded-xl p-4">
              <div className="text-xs text-gray-400 uppercase">Total in Local</div>
              <div className="text-3xl font-bold text-white mt-1">{report.totalPilots}</div>
              <div className="text-[11px] text-cyan-400 mt-1">Active roster</div>
            </div>

            <div className="bg-[#0f1422] border border-red-900/40 rounded-xl p-4">
              <div className="text-xs text-red-400 uppercase">High Threat Hostiles</div>
              <div className="text-3xl font-bold text-red-400 mt-1">{report.hostileCount}</div>
              <div className="text-[11px] text-gray-400 mt-1">&gt; 75% Danger Rating</div>
            </div>

            <div className="bg-[#0f1422] border border-purple-900/40 rounded-xl p-4">
              <div className="text-xs text-purple-400 uppercase">Potential Cyno Alts</div>
              <div className="text-3xl font-bold text-purple-300 mt-1">{report.cynoThreatCount}</div>
              <div className="text-[11px] text-gray-400 mt-1">Hotdrop vectors</div>
            </div>

            <div className="bg-[#0f1422] border border-amber-900/40 rounded-xl p-4">
              <div className="text-xs text-amber-400 uppercase">Top Alliance</div>
              <div className="text-lg font-bold text-amber-300 mt-1 truncate">
                {report.alliances[0]?.name || 'Neutral / Unaligned'}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {report.alliances[0]?.count || 0} pilots present
              </div>
            </div>
          </div>

          {/* Filtering toolbar */}
          <div className="bg-[#0f1422] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <button
                onClick={() => setFilterThreat('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterThreat === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-black/40 text-gray-400 border border-gray-800'
                }`}
              >
                All Pilots ({report.pilots.length})
              </button>
              <button
                onClick={() => setFilterThreat('high')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterThreat === 'high'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                    : 'bg-black/40 text-gray-400 border border-gray-800'
                }`}
              >
                High Danger Only ({report.hostileCount})
              </button>
              <button
                onClick={() => setFilterThreat('cyno')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterThreat === 'cyno'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                    : 'bg-black/40 text-gray-400 border border-gray-800'
                }`}
              >
                Cyno Threat ({report.cynoThreatCount})
              </button>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pilot, corp, alliance..."
                className="w-full bg-black/60 border border-gray-800 focus:border-cyan-500 rounded pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Pilot Table */}
          <div className="bg-[#0f1422] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#141b2e] border-b border-gray-800 text-gray-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Pilot</th>
                    <th className="py-3 px-4">Corp / Alliance</th>
                    <th className="py-3 px-4">Sec Status</th>
                    <th className="py-3 px-4">Danger Rating</th>
                    <th className="py-3 px-4">Kills / Losses</th>
                    <th className="py-3 px-4">Combat Notes</th>
                    <th className="py-3 px-4 text-right">zKillboard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {filteredPilots.map((pilot) => (
                    <tr
                      key={pilot.name}
                      className={`hover:bg-[#161f36] transition-colors ${
                        pilot.isHighThreat ? 'bg-red-950/5' : ''
                      }`}
                    >
                      {/* Pilot Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {pilot.characterId ? (
                            <img
                              src={`https://images.evetech.net/characters/${pilot.characterId}/portrait?size=64`}
                              alt={pilot.name}
                              className="w-8 h-8 rounded-full border border-cyan-900/60 object-cover shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded bg-black/60 border border-cyan-900/40 flex items-center justify-center font-bold text-cyan-400 text-xs shrink-0">
                              {pilot.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-semibold text-white tracking-wide">
                            {pilot.name}
                          </span>
                        </div>
                      </td>

                      {/* Corp / Alliance */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-gray-300 font-sans text-xs">
                            {pilot.corporationName || 'Independent'}
                          </span>
                          {pilot.allianceName && (
                            <span className="text-[11px] text-amber-400/90">
                              [{pilot.allianceName}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sec Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            (pilot.securityStatus || 0) <= -2.0
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : (pilot.securityStatus || 0) < 0
                              ? 'bg-orange-950 text-orange-400 border border-orange-800'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}
                        >
                          {(pilot.securityStatus || 0) > 0 ? `+${pilot.securityStatus}` : pilot.securityStatus}
                        </span>
                      </td>

                      {/* Danger Rating Bar */}
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full ${
                                (pilot.dangerRating || 0) > 80
                                  ? 'bg-red-500'
                                  : (pilot.dangerRating || 0) > 50
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-500'
                              }`}
                              style={{ width: `${pilot.dangerRating || 0}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold ${
                              (pilot.dangerRating || 0) > 80
                                ? 'text-red-400'
                                : (pilot.dangerRating || 0) > 50
                                ? 'text-amber-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {pilot.dangerRating}%
                          </span>
                        </div>
                      </td>

                      {/* Kills / Losses */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold">{pilot.kills?.toLocaleString()}</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-red-400">{pilot.losses?.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Combat Notes */}
                      <td className="py-3 px-4">
                        {pilot.notes ? (
                          <span className="text-red-300 bg-red-950/60 px-2 py-0.5 rounded text-[11px] border border-red-800/40">
                            {pilot.notes}
                          </span>
                        ) : pilot.isCynoPilot ? (
                          <span className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded text-[11px] border border-purple-800/40">
                            Cyno Pilot Detected
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Standard Fleet Pilot</span>
                        )}
                      </td>

                      {/* zKill link */}
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`https://zkillboard.com/search/${encodeURIComponent(pilot.name)}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-900 hover:bg-cyan-950 text-gray-400 hover:text-cyan-300 border border-gray-800 hover:border-cyan-600 transition-colors"
                          title="Open on zKillboard"
                        >
                          <span>zKill</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
