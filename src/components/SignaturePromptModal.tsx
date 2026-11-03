import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Compass, Sparkles, X, Check, ArrowRight, ShieldAlert, Clock, Activity, Zap, Trash2 } from 'lucide-react';
import { mapperService } from '../services/mapperService';

interface SignaturePromptModalProps {
  isOpen: boolean;
  fromSystem: string;
  toSystem: string;
  initialSig?: string;
  initialType?: string;
  initialMass?: 'stable' | 'destab' | 'critical';
  initialTime?: 'stable' | 'eol';
  initialTactical?: 'clear' | 'bubbled' | 'camped';
  initialIsFrig?: boolean;
  connectionId?: string;
  onClose: () => void;
  onSaved?: (sig: string) => void;
}

const COMMON_WH_TYPES = [
  'K162', 'H296', 'D382', 'B274', 'C247', 'Z647', 'N432', 'A641', 'X702', 'Q063', 'E545', 'L477'
];

export const SignaturePromptModal: React.FC<SignaturePromptModalProps> = ({
  isOpen,
  fromSystem,
  toSystem,
  initialSig = '',
  initialType = 'K162',
  initialMass = 'stable',
  initialTime = 'stable',
  initialTactical = 'clear',
  initialIsFrig = false,
  connectionId,
  onClose,
  onSaved
}) => {
  const [currentFromSystem, setCurrentFromSystem] = useState<string>(fromSystem);
  const [sigInput, setSigInput] = useState<string>(initialSig);
  const [wormholeType, setWormholeType] = useState<string>(initialType);
  const [massStatus, setMassStatus] = useState<'stable' | 'destab' | 'critical'>(initialMass);
  const [timeStatus, setTimeStatus] = useState<'stable' | 'eol'>(initialTime);
  const [tactical, setTactical] = useState<'clear' | 'bubbled' | 'camped'>(initialTactical);
  const [isFrig, setIsFrig] = useState<boolean>(initialIsFrig);
  const [pasteText, setPasteText] = useState<string>('');

  const knownSystems = Object.keys(mapperService.getState().systems).filter(s => s !== toSystem);

  useEffect(() => {
    setCurrentFromSystem(fromSystem || knownSystems[0] || 'Previous System');
    setSigInput(initialSig);
    setWormholeType(initialType || 'K162');
    setMassStatus(initialMass);
    setTimeStatus(initialTime);
    setTactical(initialTactical);
    setIsFrig(initialIsFrig);
    setPasteText('');
  }, [isOpen, initialSig, initialType, initialMass, initialTime, initialTactical, initialIsFrig, fromSystem, toSystem]);

  if (!isOpen) return null;

  // Auto extract 3-letter signature from paste or typed string (e.g. "ANF-123" -> "ANF")
  const handleSigChange = (value: string) => {
    const raw = value.trim().toUpperCase();
    const match = raw.match(/^([A-Z]{3})/);
    if (match) {
      setSigInput(match[1]);
    } else {
      setSigInput(raw.slice(0, 7));
    }
  };

  const handleScanPaste = (text: string) => {
    setPasteText(text);
    // Try to find cosmic signature format like "ABC-123 Cosmic Signature Wormhole"
    const match = text.match(/([A-Z]{3})[-–](\d{3})/i);
    if (match) {
      setSigInput(match[1].toUpperCase());
    }

    // Check if wormhole type is mentioned
    for (const wt of COMMON_WH_TYPES) {
      if (new RegExp(`\\b${wt}\\b`, 'i').test(text)) {
        setWormholeType(wt);
        break;
      }
    }

    // Check mass/time
    if (/destabilized|half|reduced/i.test(text)) setMassStatus('destab');
    if (/verge of|critical/i.test(text)) setMassStatus('critical');
    if (/end of life|eol/i.test(text)) setTimeStatus('eol');
  };

  const handleSave = () => {
    const cleanSig = sigInput.trim().toUpperCase();
    const effectiveFrom = currentFromSystem.trim() || fromSystem;
    mapperService.updateConnection({
      connectionId,
      from: effectiveFrom,
      to: toSystem,
      sigFrom: cleanSig || undefined,
      wormholeType: wormholeType.trim().toUpperCase() || 'Wormhole',
      massStatus,
      timeStatus,
      tactical,
      isFrig
    });

    if (onSaved) onSaved(cleanSig);
    onClose();
  };

  const handleDeleteConnection = () => {
    const effectiveFrom = currentFromSystem.trim() || fromSystem;
    if (window.confirm(`Delete connection between ${effectiveFrom} and ${toSystem}?`)) {
      mapperService.deleteConnection(connectionId, effectiveFrom, toSystem);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono">
      <div className="relative w-full max-w-lg bg-[#0a0f1d] border border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-950/80 via-[#0d162b] to-[#0a0f1d] border-b border-cyan-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-600/40">
                  WORMHOLE CONNECTION
                </span>
                <span className="text-xs text-gray-400">ASSIGN FEATURES</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Jumped from:</span>
                  <select
                    value={currentFromSystem}
                    onChange={(e) => setCurrentFromSystem(e.target.value)}
                    className="bg-black/70 border border-cyan-500/40 rounded-lg px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {knownSystems.map(sys => (
                      <option key={sys} value={sys} className="bg-[#0a0f1d] text-white">
                        {sys}
                      </option>
                    ))}
                    {!knownSystems.includes(currentFromSystem) && currentFromSystem && (
                      <option value={currentFromSystem} className="bg-[#0a0f1d] text-white">
                        {currentFromSystem}
                      </option>
                    )}
                  </select>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-cyan-300 font-bold text-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                  {toSystem}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* HIGH-PRIORITY PROMINENT EOL QUICK TOGGLE */}
          <div className="p-3.5 rounded-2xl bg-[#060a14] border border-white/10 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${timeStatus === 'eol' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Wormhole Life (EOL)</span>
                  {timeStatus === 'eol' && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-500 text-white animate-pulse">
                      EOL ACTIVE
                    </span>
                  )}
                </span>
                <p className="text-[10px] text-gray-400">
                  {timeStatus === 'eol' ? 'Reaching End of Life (under 4 hours remaining)' : 'Stable lifetime (more than 4 hours remaining)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setTimeStatus('stable')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeStatus === 'stable'
                    ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Stable
              </button>
              <button
                type="button"
                onClick={() => setTimeStatus('eol')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeStatus === 'eol'
                    ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] font-extrabold animate-pulse'
                    : 'text-rose-400 hover:text-white hover:bg-rose-950/40'
                }`}
              >
                🔥 EOL
              </button>
            </div>
          </div>

          {/* Main Question */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>What signature did you jump through from {fromSystem}?</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={sigInput}
                onChange={(e) => handleSigChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                placeholder="e.g. ANF (or ANF-123)"
                autoFocus
                maxLength={7}
                className="w-full bg-[#050811] border-2 border-cyan-500/60 rounded-xl px-4 py-3 text-2xl font-bold tracking-widest text-cyan-200 placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center uppercase transition-all"
              />
              <div className="absolute right-3 top-3 text-[10px] text-cyan-400/80 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800/60 pointer-events-none">
                SIG CODE
              </div>
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              This signature will label the connector line: <span className="text-cyan-300 font-bold">[{sigInput || 'SIG'}]</span> on your chain map
            </p>
          </div>

          {/* Quick Wormhole Type Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-semibold">Wormhole Type (Static / Lead)</span>
              <span className="text-[11px] text-cyan-400 font-bold">{wormholeType}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_WH_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWormholeType(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    wormholeType === type
                      ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-300'
                      : 'bg-[#0f172a] text-gray-300 hover:text-white hover:bg-[#1e293b] border border-gray-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Mass & Time Status Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mass Status */}
            <div className="space-y-1.5">
              <span className="text-xs text-gray-300 font-semibold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mass Status</span>
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setMassStatus('stable')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                    massStatus === 'stable'
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-[#0d1424] border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>Stable (&gt;50%)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </button>

                <button
                  type="button"
                  onClick={() => setMassStatus('destab')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                    massStatus === 'destab'
                      ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-[#0d1424] border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>Destab / Half (&lt;50%)</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                </button>

                <button
                  type="button"
                  onClick={() => setMassStatus('critical')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                    massStatus === 'critical'
                      ? 'bg-red-950/70 border-red-400 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                      : 'bg-[#0d1424] border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>Critical (&lt;10%)</span>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                </button>
              </div>
            </div>

            {/* Time Status */}
            <div className="space-y-1.5">
              <span className="text-xs text-gray-300 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Life / Time</span>
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setTimeStatus('stable')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                    timeStatus === 'stable'
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-[#0d1424] border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>Stable (&gt;4h)</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                </button>

                <button
                  type="button"
                  onClick={() => setTimeStatus('eol')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                    timeStatus === 'eol'
                      ? 'bg-purple-950/70 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-[#0d1424] border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>EOL / Ending (&lt;4h)</span>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                </button>
              </div>

              {/* Paste from Probe Scanner */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Paste probe scan line..."
                  value={pasteText}
                  onChange={(e) => handleScanPaste(e.target.value)}
                  className="w-full bg-[#050811] border border-gray-800 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Tactical Tags: Clear, Bubbled, Camped, Frig Hole */}
          <div className="p-3 bg-[#070b16] border border-cyan-950/60 rounded-xl space-y-2">
            <span className="text-xs text-gray-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Tactical & Transit Status</span>
              </span>
              <span className="text-[10px] text-gray-500">GalaxyFinder Tags</span>
            </span>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTactical('clear')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                  tactical === 'clear'
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#0a0f1d] border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setTactical('bubbled')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                  tactical === 'bubbled'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-[#0a0f1d] border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Bubbled
              </button>
              <button
                type="button"
                onClick={() => setTactical('camped')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                  tactical === 'camped'
                    ? 'bg-red-950/80 border-red-400 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                    : 'bg-[#0a0f1d] border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Camped
              </button>
              <button
                type="button"
                onClick={() => setIsFrig(!isFrig)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                  isFrig
                    ? 'bg-sky-950/80 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                    : 'bg-[#0a0f1d] border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Frig Hole
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#070b16] border-t border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConnection}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/40 hover:border-rose-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Delete this connection between systems"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Connection</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_18px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>SAVE FEATURES [{sigInput || (wormholeType === 'Stargate' ? 'GATE' : 'WH')}]</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
