import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Check, Shield, Crosshair, Zap, Cpu, Compass, Layers, 
  ExternalLink, ChevronDown, Sparkles, Navigation, Flame, Radio, Wrench
} from 'lucide-react';
import { parseEFTFit, ParsedFit } from '../services/eftParser';

const POPULAR_WH_FITS = [
  {
    name: 'Loki - Covert Web & Neut Hunter',
    shipName: 'Loki',
    typeId: 29990,
    fit: `[Loki, Stealth Web Hunter]
Damage Control II
Gyrostabilizer II
Gyrostabilizer II
Tracking Enhancer II

50MN Quad LiF Restrained Microwarpdrive
Federation Navy Stasis Webifier
Warp Disruptor II
Republic Fleet Large Cap Battery
Large Shield Extender II

Covert Ops Cloaking Device II
Covert Cynosural Field Generator I
Medium Energy Neutralizer II
220mm Vulcan AutoCannon II
220mm Vulcan AutoCannon II
220mm Vulcan AutoCannon II
220mm Vulcan AutoCannon II

Medium Core Defense Field Extender II
Medium Core Defense Field Extender II
Medium Core Defense Field Extender II

Loki Core - Immobility Driver
Loki Defensive - Adaptive Augmenter
Loki Offensive - Projectile Scoping Array
Loki Propulsion - Intercalated Nanofibers

Warrior II x5
Hornet EC-300 x5`
  },
  {
    name: 'Tengu - CovOps Heavy Missile',
    shipName: 'Tengu',
    typeId: 29984,
    fit: `[Tengu, Covert Heavy Missile]
Ballistic Control System II
Ballistic Control System II
Ballistic Control System II
Nanofiber Internal Structure II

10MN Afterburner II
Republic Fleet Large Cap Battery
Pithum C-Type Medium Shield Booster
Multispectrum Shield Hardener II
Warp Scrambler II
Stasis Webifier II

Covert Ops Cloaking Device II
Heavy Missile Launcher II
Heavy Missile Launcher II
Heavy Missile Launcher II
Heavy Missile Launcher II
Heavy Missile Launcher II
Heavy Missile Launcher II

Medium Core Defense Operational Solidifier II
Medium Capacitor Control Circuit II
Medium EM Shield Reinforcer II

Tengu Core - Electronic Efficiency Gate
Tengu Defensive - Covert Reconfiguration
Tengu Offensive - Accelerated Ejection Bay
Tengu Propulsion - Chassis Conformation

Caldari Navy Scourge Heavy Missile x2000`
  },
  {
    name: 'Stratios - Covert Drone Brawler',
    shipName: 'Stratios',
    typeId: 33470,
    fit: `[Stratios, Relic Hunter Brawler]
Damage Control II
Medium Armor Repairer II
Reactive Armor Hardener
Multispectrum Energized Membrane II
Drone Damage Amplifier II

50MN Microwarpdrive II
Warp Scrambler II
Stasis Webifier II
Relic Analyzer II
Republic Fleet Medium Cap Battery

Covert Ops Cloaking Device II
Covert Cynosural Field Generator I
Medium Energy Neutralizer II
Small Energy Neutralizer II
Sisters Core Probe Launcher

Medium Auxiliary Nano Pump I
Medium Nanobot Accelerator I
Medium Trimark Armor Pump I

Hammerhead II x5
Infiltrator II x5
Warrior II x5`
  },
  {
    name: 'Sabre - Fleet Interdictor Bubble',
    shipName: 'Sabre',
    typeId: 22456,
    fit: `[Sabre, Fleet Interdictor]
Nanofiber Internal Structure II
Nanofiber Internal Structure II

5MN Quad LiF Restrained Microwarpdrive
Medium Shield Extender II
Warp Disruptor II
Faint Epsilon Scoped Warp Scrambler

Interdiction Sphere Launcher I
200mm AutoCannon II
200mm AutoCannon II
200mm AutoCannon II
200mm AutoCannon II
200mm AutoCannon II
[Empty High slot]

Small Core Defense Field Extender II
Small Core Defense Field Extender II

Warp Disrupt Probe x40
Republic Fleet EMP S x1500`
  },
  {
    name: 'Astero - Ghost Hunter & Covert Hack',
    shipName: 'Astero',
    typeId: 33468,
    fit: `[Astero, Covert Explorer Hunter]
Damage Control II
Small Armor Repairer II
Multispectrum Energized Membrane II
Drone Damage Amplifier II

1MN Afterburner II
Warp Scrambler II
Stasis Webifier II
Data Analyzer II

Covert Ops Cloaking Device II
Sisters Core Probe Launcher

Small Auxiliary Nano Pump II
Small Nanobot Accelerator I
Small Gravity Capacitor Upgrade I

Hobgoblin II x5
Warrior II x5`
  }
];

interface ShipFittingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFitText?: string;
  theme?: 'dark' | 'light';
}

export const ShipFittingsModal: React.FC<ShipFittingsModalProps> = ({
  isOpen,
  onClose,
  initialFitText,
  theme = 'dark'
}) => {
  const [inputText, setInputText] = useState<string>(() => initialFitText || POPULAR_WH_FITS[0].fit);
  const [fit, setFit] = useState<ParsedFit | null>(() => parseEFTFit(initialFitText || POPULAR_WH_FITS[0].fit));
  const [copied, setCopied] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);

  useEffect(() => {
    if (initialFitText) {
      setInputText(initialFitText);
      setFit(parseEFTFit(initialFitText));
    }
  }, [initialFitText]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetFit: string) => {
    setInputText(presetFit);
    setFit(parseEFTFit(presetFit));
    setShowPresets(false);
  };

  const handleCopyEFT = async () => {
    if (!inputText) return;
    await navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDark = theme === 'dark';
  const shipType = fit?.shipName || 'Ship';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none font-sans text-xs">
      <div className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl transition-all ${
        isDark 
          ? 'bg-[#090d18]/95 border-white/10 text-slate-200 shadow-[0_25px_60px_rgba(0,0,0,0.8)]' 
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_25px_50px_rgba(0,0,0,0.15)]'
      }`}>
        {/* Top Window Bar (Apple macOS Sequoia / VisionOS Frosted Glass Titlebar) */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3 h-3" />
                <span>Tactical Ship Fitting Window</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{fit?.shipName || 'Vessel'}</span>
                <span className="text-slate-400 font-normal text-sm">
                  {fit?.fitName ? `— "${fit.fitName}"` : ''}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preset Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fittings Presets</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPresets && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0b101d] border border-white/10 shadow-2xl p-1.5 z-50 space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase">
                    Wormhole Fleet Staples
                  </div>
                  {POPULAR_WH_FITS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => handleSelectPreset(p.fit)}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/15 text-slate-200 hover:text-cyan-300 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.shipName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy EFT Button */}
            <button
              onClick={handleCopyEFT}
              className="px-3 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
              title="Copy EFT syntax to clipboard for in-game import"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Game!' : 'Copy EFT Fit'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-red-400" />
                <span>Estimated DPS</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                520 <span className="text-xs text-slate-400 font-normal">DPS</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>Effective HP</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                68.5k <span className="text-xs text-slate-400 font-normal">EHP</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Capacitor</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                Stable <span className="text-xs text-slate-400 font-normal">(42%)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Compass className="w-3 h-3 text-indigo-400" />
                <span>Propulsion Speed</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                1,820 <span className="text-xs text-slate-400 font-normal">m/s (MWD)</span>
              </div>
            </div>
          </div>

          {/* Module Slots Grid: High, Mid, Low, Rigs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column: High & Subsystems */}
            <div className="space-y-4">
              {/* High Slots */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-400 pb-1.5 border-b border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>High Slots ({fit?.highSlots?.length || 0})</span>
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {(fit?.highSlots || []).map((m: string, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-slate-200">
                      <span className="truncate">{m}</span>
                      <span className="text-[9px] text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-500/10 shrink-0">HIGH</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subsystems (T3 Cruisers) */}
              {fit?.subsystems && fit.subsystems.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400 pb-1.5 border-b border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Tech III Subsystems ({fit.subsystems.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {fit.subsystems.map((sub: string, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 text-indigo-300">
                        {sub}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rigs */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 pb-1.5 border-b border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Rig Slots ({fit?.rigs?.length || 0})</span>
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {(fit?.rigs || []).map((m: string, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-slate-200">
                      <span className="truncate">{m}</span>
                      <span className="text-[9px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 shrink-0">RIG</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Mid & Low Slots */}
            <div className="space-y-4">
              {/* Mid Slots */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-400 pb-1.5 border-b border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Mid Slots ({fit?.medSlots?.length || 0})</span>
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {(fit?.medSlots || []).map((m: string, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-slate-200">
                      <span className="truncate">{m}</span>
                      <span className="text-[9px] text-blue-400 font-bold px-1.5 py-0.5 rounded bg-blue-500/10 shrink-0">MID</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Slots */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 pb-1.5 border-b border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Low Slots ({fit?.lowSlots?.length || 0})</span>
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {(fit?.lowSlots || []).map((m: string, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-slate-200">
                      <span className="truncate">{m}</span>
                      <span className="text-[9px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 shrink-0">LOW</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drones & Cargo */}
              {fit?.drones && fit.drones.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pb-1.5 border-b border-white/5">
                    <span>Drones &amp; Ammo</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-300">
                    {fit.drones.map((d, idx: number) => (
                      <div key={idx} className="p-1.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                        <span>{d.name}</span>
                        <span className="text-cyan-400 font-bold">x{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Toggleable Raw EFT Paste Area */}
          <div className="pt-2">
            <button
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-medium text-xs cursor-pointer"
            >
              <span>{showPasteBox ? 'Hide EFT Raw Text' : 'Paste Custom In-Game EFT Fit'}</span>
            </button>

            {showPasteBox && (
              <div className="mt-2 space-y-2">
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setFit(parseEFTFit(e.target.value));
                  }}
                  placeholder="Paste in-game EFT format: [Vessel, Name]..."
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>EFT Standard Fit</span>
            <span>•</span>
            <span>Ready for In-Game Import (<kbd className="px-1 rounded bg-black/60 text-cyan-300 font-mono">Ctrl+V</kbd>)</span>
          </div>

          <button
            onClick={handleCopyEFT}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-cyan-500/20"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to EVE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
