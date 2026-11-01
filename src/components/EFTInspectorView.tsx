import React, { useState } from 'react';
import { Cpu, Copy, Check, Sparkles, Trash2, Shield, Crosshair } from 'lucide-react';
import { parseEFTFit, ParsedFit } from '../services/eftParser';

const SAMPLE_FITS = [
  {
    name: 'Nano Vagabond (Skirmish)',
    fit: `[Vagabond, Nano Kiter]
Damage Control II
Gyrostabilizer II
Gyrostabilizer II
Nanofiber Internal Structure II
Tracking Enhancer II

50MN Microwarpdrive II
Large Shield Extender II
Warp Disruptor II
Adaptive Invulnerability Field II

220mm Vulcan AutoCannon II
220mm Vulcan AutoCannon II
220mm Vulcan AutoCannon II
220mm Vulcan AutoCannon II
220mm Vulcan AutoCannon II
Small Energy Neutralizer II

Medium Anti-EM Screen Reinforcer II
Medium Core Defense Field Extender II

Warrior II x5`
  },
  {
    name: 'Paladin (Bastion Beam)',
    fit: `[Paladin, Heavy Armor Bastion]
Damage Control II
Imperial Navy Heat Sink
Imperial Navy Heat Sink
Imperial Navy Heat Sink
Corpii A-Type Small Armor Repairer
Corpus X-Type Large Armor Repairer
Centus X-Type Large Armor Repairer

100MN Afterburner II
Heavy Stasis Grappler II
Republic Fleet Large Cap Battery
Federation Navy Stasis Webifier

Mega Pulse Laser II
Mega Pulse Laser II
Mega Pulse Laser II
Mega Pulse Laser II
Bastion Module I
Heavy Energy Neutralizer II
Imperial Navy Heavy Energy Nosferatu

Large Auxiliary Nano Pump II
Large Nanobot Accelerator II

Acolyte II x5`
  }
];

export const EFTInspectorView: React.FC = () => {
  const [inputText, setInputText] = useState<string>(SAMPLE_FITS[0].fit);
  const [fit, setFit] = useState<ParsedFit | null>(() => parseEFTFit(SAMPLE_FITS[0].fit));
  const [copied, setCopied] = useState<boolean>(false);

  const handleParse = (text: string) => {
    setInputText(text);
    const result = parseEFTFit(text);
    setFit(result);
  };

  const handleCopy = async () => {
    if (!fit) return;
    await navigator.clipboard.writeText(fit.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Console Input */}
      <div className="bg-[#0f1422] border border-cyan-900/40 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-wide flex items-center gap-2">
                EFT / PYFA FITTING INSPECTOR
                <span className="text-[11px] font-normal text-indigo-400/80 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                  EFT Clipboard Format
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Inspect ship fitting loadouts, slot distributions, and drone bay configurations
              </p>
            </div>
          </div>

          {/* Sample Fits */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Presets:
            </span>
            {SAMPLE_FITS.map(s => (
              <button
                key={s.name}
                onClick={() => handleParse(s.fit)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-gray-900 hover:bg-indigo-950/60 text-gray-300 hover:text-indigo-300 border border-gray-800 hover:border-indigo-600/50 transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="[ShipName, FitName]&#10;Damage Control II&#10;...&#10;&#10;50MN Microwarpdrive II&#10;..."
            rows={5}
            className="w-full bg-[#090d16] border border-gray-800 focus:border-indigo-500 rounded-lg p-3 font-mono text-xs text-indigo-200 placeholder-gray-600 focus:outline-none resize-y"
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/60 text-xs font-mono">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleParse(inputText)}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(99,102,241,0.3)]"
            >
              <Cpu className="w-4 h-4" />
              <span>INSPECT FIT</span>
            </button>
            <button
              onClick={() => {
                setInputText('');
                setFit(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-red-400 border border-gray-800 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {fit && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-indigo-950 text-indigo-300 border border-gray-800 hover:border-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Fit' : 'Copy Fit'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Fit Layout */}
      {fit && (
        <div className="bg-[#0f1422] border border-gray-800 rounded-xl p-6 shadow-xl">
          {/* Fit Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">HULL CONFIGURATION</span>
              <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                {fit.shipName} <span className="text-gray-400 font-normal">({fit.fitName})</span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* High Slots */}
            <div className="p-4 rounded-lg bg-[#0a0e18] border border-red-900/30">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
                <span className="text-red-400 font-bold uppercase">High Slots</span>
                <span className="text-gray-400">{fit.highSlots.length}x</span>
              </div>
              <div className="space-y-1.5">
                {fit.highSlots.map((slot, i) => (
                  <div key={i} className="p-1.5 rounded bg-black/40 text-gray-200 border border-gray-800/80 truncate">
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* Mid Slots */}
            <div className="p-4 rounded-lg bg-[#0a0e18] border border-blue-900/30">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
                <span className="text-blue-400 font-bold uppercase">Mid Slots</span>
                <span className="text-gray-400">{fit.medSlots.length}x</span>
              </div>
              <div className="space-y-1.5">
                {fit.medSlots.map((slot, i) => (
                  <div key={i} className="p-1.5 rounded bg-black/40 text-gray-200 border border-gray-800/80 truncate">
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* Low Slots */}
            <div className="p-4 rounded-lg bg-[#0a0e18] border border-amber-900/30">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
                <span className="text-amber-400 font-bold uppercase">Low Slots</span>
                <span className="text-gray-400">{fit.lowSlots.length}x</span>
              </div>
              <div className="space-y-1.5">
                {fit.lowSlots.map((slot, i) => (
                  <div key={i} className="p-1.5 rounded bg-black/40 text-gray-200 border border-gray-800/80 truncate">
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* Rigs & Drones */}
            <div className="p-4 rounded-lg bg-[#0a0e18] border border-purple-900/30">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
                <span className="text-purple-400 font-bold uppercase">Rigs & Drones</span>
                <span className="text-gray-400">{fit.rigs.length + fit.drones.length}x</span>
              </div>
              <div className="space-y-1.5">
                {fit.rigs.map((rig, i) => (
                  <div key={`rig-${i}`} className="p-1.5 rounded bg-purple-950/20 text-purple-200 border border-purple-900/40 truncate">
                    {rig}
                  </div>
                ))}
                {fit.drones.map((d, i) => (
                  <div key={`drone-${i}`} className="p-1.5 rounded bg-cyan-950/20 text-cyan-200 border border-cyan-900/40 truncate flex justify-between">
                    <span>{d.name}</span>
                    <span className="text-cyan-400 font-bold">x{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
