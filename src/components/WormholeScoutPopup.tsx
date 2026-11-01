import React from 'react';
import { 
  Building2, Users, Clock, ShieldAlert, Zap, X, Copy, ExternalLink, 
  Compass, AlertTriangle, CheckCircle, Radio, Sparkles 
} from 'lucide-react';
import { ScoutAlertEvent } from '../services/scoutWatcher';

interface WormholeScoutPopupProps {
  event: ScoutAlertEvent | null;
  onClose: () => void;
  onCopyReport: () => void;
  copied: boolean;
}

export const WormholeScoutPopup: React.FC<WormholeScoutPopupProps> = ({
  event,
  onClose,
  onCopyReport,
  copied
}) => {
  if (!event) return null;

  const wh = event.wormholeInfo;
  const structCount = event.structuresDetected.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0d121f] border-2 border-cyan-500/80 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.35)] overflow-hidden font-mono">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-cyan-950 via-[#101728] to-cyan-950 border-b border-cyan-500/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  SYSTEM ENTRY DETECTED
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-200 border border-cyan-500/50">
                  LIVE SCOUT HUD
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2 mt-0.5">
                {wh.systemName}
                <span className="text-amber-400 font-bold text-lg">[{wh.wormholeClass}]</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-900/80 hover:bg-red-950/80 text-gray-400 hover:text-red-300 border border-gray-800 hover:border-red-600 transition-colors"
            title="Dismiss HUD"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Intelligence Cards */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Real Structures Scanned */}
            <div className="p-4 rounded-xl bg-[#090d16] border border-cyan-900/60 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="uppercase font-bold">Structures on Scan</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {structCount} <span className="text-xs font-normal text-gray-400">detected</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-sans">
                {structCount > 0 ? 'Verified on Directional Scanner' : 'No Upwell structures currently on scan'}
              </div>
            </div>

            {/* Static Connections */}
            <div className="p-4 rounded-xl bg-[#090d16] border border-indigo-900/60 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 mb-1">
                <Compass className="w-4 h-4" />
                <span className="uppercase font-bold">Wormhole Statics</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {wh.statics.join(', ')}
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-sans">
                Standard static connections for {wh.wormholeClass}
              </div>
            </div>
          </div>

          {/* Real Structures Breakdown List */}
          <div className="bg-[#090d16] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800 text-xs">
              <span className="font-bold text-gray-300 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Scanned Structures ({structCount})
              </span>
            </div>

            {structCount === 0 ? (
              <div className="py-4 text-center text-gray-500 text-xs font-sans">
                No citadels or refineries visible on 14.3 AU Directional Scan.
              </div>
            ) : (
              <div className="space-y-2">
                {event.structuresDetected.map((struct, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-gray-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span className="font-bold text-white">{struct.type}</span>
                      <span className="text-gray-400 font-sans">({struct.name})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold text-amber-400 font-mono">
                      {struct.distance}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#090d16] border-t border-gray-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onCopyReport}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY DISCORD WH REPORT'}</span>
            </button>

            <a
              href={`https://zkillboard.com/system/${wh.systemName}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 flex items-center gap-1.5 transition-colors"
            >
              <span>View System on zKillboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
