import React from 'react';
import { AlertTriangle, ShieldAlert, Crosshair, Radio } from 'lucide-react';
import { DScanReport } from '../types/dscan';

interface ThreatAlertBannerProps {
  report: DScanReport | null;
}

export const ThreatAlertBanner: React.FC<ThreatAlertBannerProps> = ({ report }) => {
  if (!report || report.items.length === 0) return null;

  const hasBubbles = report.bubbles.length > 0;
  const hasCapitals = report.capitals.length > 0;
  const hasRecons = report.recons.length > 0;
  const hasTacklers = report.tacklers.length > 0;

  if (!hasBubbles && !hasCapitals && !hasRecons && !hasTacklers) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-red-500/60 bg-gradient-to-r from-red-950/40 via-red-900/20 to-black p-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 threat-critical shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-wider text-red-400 uppercase text-sm">
                Tactical Warning // Combat Hazards Detected
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/30 text-red-200 border border-red-500/60 uppercase">
                {report.maxThreat} Alert
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Immediate threat vectors identified on directional scanner. Assess warp alignment and exit routes.
            </p>
          </div>
        </div>

        {/* Hazard badges */}
        <div className="flex flex-wrap items-center gap-2">
          {hasBubbles && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono">
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
              <span>{report.bubbles.length}x Bubbles / Dictors</span>
            </div>
          )}

          {hasCapitals && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>{report.capitals.length}x Capital Hulls</span>
            </div>
          )}

          {hasRecons && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-950/80 border border-purple-500/60 text-purple-300 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>{report.recons.length}x Combat / Force Recons</span>
            </div>
          )}

          {hasTacklers && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-950/80 border border-orange-500/60 text-orange-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
              <span>{report.tacklers.length}x Fast Tackle / HICs</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
