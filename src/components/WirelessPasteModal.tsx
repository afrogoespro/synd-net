import React, { useState } from 'react';
import { ClipboardCheck, X } from 'lucide-react';

interface WirelessPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const WirelessPasteModal: React.FC<WirelessPasteModalProps> = ({
  isOpen,
  onClose,
  isDark
}) => {
  const [manualPasteText, setManualPasteText] = useState<string>('');

  if (!isOpen) return null;

  const handleBroadcast = () => {
    if (manualPasteText.trim()) {
      import('../services/scoutWatcher').then(({ scoutWatcher }) => {
        scoutWatcher.evaluateText(manualPasteText.trim(), 'dscan_paste');
      });
      setManualPasteText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 font-sans ${
        isDark ? 'bg-[#121622] border-purple-500/30 text-white shadow-[0_12px_48px_rgba(0,0,0,0.85)]' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Wireless Clipboard Bridge</h3>
              <p className="text-[11px] text-slate-400">Share D-Scan, Cosmic Signatures, or Systems wirelessly with fleet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-2 leading-relaxed">
          In EVE Online, copy any <strong className="text-purple-300">D-Scan window</strong> (Ctrl+A, Ctrl+C), <strong className="text-cyan-300">Probe Scanner signatures</strong>, or <strong className="text-emerald-300">System Name</strong>. Paste below to broadcast to all connected fleet members:
        </p>

        <textarea
          value={manualPasteText}
          onChange={(e) => setManualPasteText(e.target.value)}
          placeholder="Paste EVE clipboard text here (Ctrl+V)..."
          rows={6}
          className="w-full bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-400 resize-none mb-4"
          autoFocus
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OS Auto-Listener Active
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
            >
              Close
            </button>
            <button
              onClick={handleBroadcast}
              disabled={!manualPasteText.trim()}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
            >
              Broadcast Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
