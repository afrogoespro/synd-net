import React, { useState, useEffect } from 'react';
import { 
  Radar, Compass, Building2, Copy, Check, Trash2, Plus, 
  ChevronUp, ChevronDown, Minimize2, Maximize2, Shield, AlertTriangle, 
  Flame, Radio, Search, ExternalLink, Zap, Layers, Sparkles
} from 'lucide-react';
import { parseDScan, generateDiscordReport } from '../services/dscanParser';
import { DScanReport } from '../types/dscan';
import { parseProbeScanner } from '../services/probeScannerParser';
import { WormholeNode, WormholeSignature, ScannedStructure } from '../types/mapper';
import { mapperService } from '../services/mapperService';
import { scoutWatcher } from '../services/scoutWatcher';

interface IntegratedIntelDeckProps {
  selectedSystem: WormholeNode;
  theme?: 'dark' | 'light';
  onLinkWormhole?: (sig: WormholeSignature) => void;
}

export const IntegratedIntelDeck: React.FC<IntegratedIntelDeckProps> = ({
  selectedSystem,
  theme = 'dark',
  onLinkWormhole
}) => {
  const isDark = theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState<'dscan' | 'sigs' | 'structs'>('dscan');
  const [deckHeight, setDeckHeight] = useState<'minimized' | 'compact' | 'full'>('compact');
  
  // D-Scan State
  const [dscanInput, setDscanInput] = useState<string>('');
  const [dscanReport, setDscanReport] = useState<DScanReport | null>(null);
  const [copiedDScan, setCopiedDScan] = useState<boolean>(false);
  
  // Probe Scanner / Anomaly State
  const [probeInput, setProbeInput] = useState<string>('');
  const [newSigId, setNewSigId] = useState<string>('');
  const [newSigGroup, setNewSigGroup] = useState<'Wormhole' | 'Relic' | 'Data' | 'Gas' | 'Ore' | 'Combat'>('Gas');
  const [newSigName, setNewSigName] = useState<string>('');
  const [showAddSigModal, setShowAddSigModal] = useState<boolean>(false);
  const [sigFilter, setSigFilter] = useState<string>('all');
  const [searchSig, setSearchSig] = useState<string>('');

  // Auto-listen to clipboard
  useEffect(() => {
    const unsub = scoutWatcher.onClipboardText((text) => {
      // If it looks like probe scanner
      if (text.includes('Cosmic Signature') || text.includes('Cosmic Anomaly') || /[A-Z]{3}-\d{2,3}/.test(text)) {
        handleParseProbeScan(text);
      } else if (text.includes('AU') || text.includes('km') || text.includes('Force Field')) {
        handleParseDScan(text);
      }
    });
    return () => unsub();
  }, [selectedSystem.id]);

  const handleParseDScan = (text: string) => {
    if (!text.trim()) return;
    setDscanInput(text);
    const parsed = parseDScan(text);
    setDscanReport(parsed);

    // If structures detected, automatically sync to selected system!
    const structs: ScannedStructure[] = parsed.items
      .filter(item => 
        item.shipInfo.role === 'Citadel / Upwell' ||
        /astrahus|fortizar|raitaru|azbel|athanor|tatara|keepstar/i.test(item.itemType)
      )
      .map(item => ({
        id: `struct-${Date.now()}-${Math.random()}`,
        name: item.itemName,
        type: item.itemType,
        distance: item.distanceStr,
        scoutedBy: 'Fleet',
        timestamp: new Date().toISOString().slice(11, 16)
      }));

    if (structs.length > 0) {
      mapperService.syncScannedStructures(selectedSystem.id, structs);
    }
  };

  const handleCopyDScanDiscord = async () => {
    if (!dscanReport) return;
    const txt = generateDiscordReport(dscanReport);
    await navigator.clipboard.writeText(txt);
    setCopiedDScan(true);
    setTimeout(() => setCopiedDScan(false), 2000);
  };

  // Parse probe scanner output & save signatures
  const handleParseProbeScan = (text: string) => {
    if (!text.trim()) return;
    setProbeInput(text);
    const report = parseProbeScanner(text);
    
    // Combine all scanned sites
    const allSites = [
      ...report.oreAndGasSites,
      ...report.combatSites,
      ...report.wormholes,
      ...report.otherSites
    ];

    if (allSites.length === 0) return;

    const existingSigs = selectedSystem.signatures || [];
    const updatedSigs = [...existingSigs];

    allSites.forEach(s => {
      const idx = updatedSigs.findIndex(sig => sig.sigId === s.id);
      const sigData: WormholeSignature = {
        id: `sig-${Date.now()}-${Math.random()}`,
        sigId: s.id || `SIG-${Math.floor(Math.random() * 900 + 100)}`,
        type: s.group === 'Ore Site' ? 'Ore' : s.group === 'Gas Site' ? 'Gas' : s.group === 'Combat Site' ? 'Combat' : s.group === 'Relic Site' ? 'Relic' : s.group === 'Data Site' ? 'Data' : s.group === 'Wormhole' ? 'Wormhole' : 'Anomaly',
        name: s.name || s.group,
        group: s.group,
        distance: s.distanceStr,
        signalPercent: s.signalPercent || 100,
        createdTime: new Date().toISOString().slice(11, 16)
      };

      if (idx >= 0) {
        updatedSigs[idx] = { ...updatedSigs[idx], ...sigData };
      } else {
        updatedSigs.push(sigData);
      }
    });

    mapperService.syncSystemSignatures(selectedSystem.id, updatedSigs);
  };

  // Manual Add Sig
  const handleAddManualSig = () => {
    if (!newSigId.trim()) return;
    const cleanId = newSigId.trim().toUpperCase();
    const current = selectedSystem.signatures || [];
    const newEntry: WormholeSignature = {
      id: `sig-${Date.now()}`,
      sigId: cleanId,
      type: newSigGroup,
      name: newSigName.trim() || `${newSigGroup} Site`,
      group: newSigGroup === 'Wormhole' ? 'Cosmic Signature' : 'Cosmic Anomaly',
      createdTime: new Date().toISOString().slice(11, 16)
    };
    mapperService.syncSystemSignatures(selectedSystem.id, [...current, newEntry]);
    setNewSigId('');
    setNewSigName('');
    setShowAddSigModal(false);
  };

  // Delete Sig
  const handleDeleteSig = (sigId: string) => {
    const current = selectedSystem.signatures || [];
    const filtered = current.filter(s => s.sigId !== sigId && s.id !== sigId);
    mapperService.syncSystemSignatures(selectedSystem.id, filtered);
  };

  // Signatures Filter
  const signaturesList = (selectedSystem.signatures || []).filter(s => {
    if (sigFilter !== 'all' && s.type.toLowerCase() !== sigFilter.toLowerCase()) return false;
    if (searchSig) {
      const q = searchSig.toLowerCase();
      return s.sigId.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q));
    }
    return true;
  });

  const sigCount = selectedSystem.signatures?.length || 0;
  const structCount = selectedSystem.structures?.length || 0;
  const threatLevel = dscanReport?.maxThreat || 'clear';

  // Height class mapping
  const heightClass = 
    deckHeight === 'minimized' ? 'h-10' :
    deckHeight === 'compact' ? 'h-64 sm:h-72' :
    'h-96 sm:h-[420px]';

  return (
    <div className={`w-full transition-all duration-200 border-t z-30 flex flex-col font-mono select-none ${
      isDark 
        ? 'bg-[#080c16]/95 border-cyan-900/60 text-gray-200 shadow-[0_-10px_25px_rgba(0,0,0,0.6)] backdrop-blur-md' 
        : 'bg-white/95 border-slate-300 text-slate-800 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur-md'
    } ${heightClass}`}>

      {/* TOP CONTROL DOCK BAR */}
      <div className={`px-4 py-2 flex items-center justify-between text-xs border-b shrink-0 ${
        isDark ? 'border-gray-800 bg-[#0a101f]' : 'border-slate-200 bg-slate-100'
      }`}>
        {/* Left Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              setActiveSubTab('dscan');
              if (deckHeight === 'minimized') setDeckHeight('compact');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'dscan'
                ? isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-sky-100 text-sky-800 border border-sky-400 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-cyan-400" />
            <span>D-Scan Radar</span>
            {dscanReport && (
              <span className={`text-[10px] px-1 rounded font-bold uppercase ${
                threatLevel === 'critical' ? 'bg-red-500 text-white animate-pulse' :
                threatLevel === 'high' ? 'bg-orange-500 text-white' :
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {threatLevel}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('sigs');
              if (deckHeight === 'minimized') setDeckHeight('compact');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'sigs'
                ? isDark ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-amber-100 text-amber-800 border border-amber-400 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Signatures &amp; Anoms</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              isDark ? 'bg-amber-900/60 text-amber-200' : 'bg-amber-200 text-amber-900'
            }`}>
              {sigCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('structs');
              if (deckHeight === 'minimized') setDeckHeight('compact');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'structs'
                ? isDark ? 'bg-purple-950 text-purple-300 border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-purple-100 text-purple-800 border border-purple-400 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Structures</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              isDark ? 'bg-purple-900/60 text-purple-200' : 'bg-purple-200 text-purple-900'
            }`}>
              {structCount}
            </span>
          </button>
        </div>

        {/* Center Active System Identifier */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-gray-400">Current System:</span>
          <span className={`font-bold px-2 py-0.5 rounded border ${
            isDark ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300' : 'bg-sky-50 border-sky-300 text-sky-800'
          }`}>
            {selectedSystem.name} ({selectedSystem.systemClass})
          </span>
        </div>

        {/* Right Dock Controls */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'dscan' && dscanReport && (
            <button
              onClick={handleCopyDScanDiscord}
              className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-bold border transition-colors ${
                isDark ? 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-800' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
              }`}
              title="Copy D-Scan Report for Discord"
            >
              {copiedDScan ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copiedDScan ? 'COPIED' : 'DISCORD'}</span>
            </button>
          )}

          {/* Height Toggles */}
          <button
            onClick={() => {
              if (deckHeight === 'minimized') setDeckHeight('compact');
              else if (deckHeight === 'compact') setDeckHeight('full');
              else setDeckHeight('compact');
            }}
            className={`p-1.5 rounded border transition-colors ${
              isDark ? 'bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
            }`}
            title={deckHeight === 'full' ? 'Compact' : 'Expand full height'}
          >
            {deckHeight === 'full' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setDeckHeight(deckHeight === 'minimized' ? 'compact' : 'minimized')}
            className={`p-1.5 rounded border transition-colors ${
              isDark ? 'bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
            }`}
            title={deckHeight === 'minimized' ? 'Restore Deck' : 'Minimize'}
          >
            {deckHeight === 'minimized' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT BODY */}
      {deckHeight !== 'minimized' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          
          {/* TAB 1: D-SCAN RADAR */}
          {activeSubTab === 'dscan' && (
            <div className="space-y-3">
              {/* Quick Paste Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste in-game D-Scan here (or copy in EVE to auto-update)..."
                  value={dscanInput}
                  onChange={(e) => handleParseDScan(e.target.value)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none transition-all ${
                    isDark 
                      ? 'bg-black/80 border-gray-800 focus:border-cyan-400 text-white placeholder-gray-600' 
                      : 'bg-slate-50 border-slate-300 focus:border-sky-500 text-slate-900 placeholder-slate-400'
                  }`}
                />
                {dscanInput && (
                  <button
                    onClick={() => {
                      setDscanInput('');
                      setDscanReport(null);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-gray-800 hover:bg-red-950 text-gray-400 hover:text-red-300 text-xs"
                    title="Clear D-Scan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* DScan Results */}
              {!dscanReport ? (
                <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${
                  isDark ? 'border-gray-800 text-gray-500' : 'border-slate-300 text-slate-500'
                }`}>
                  <Radio className="w-6 h-6 mx-auto mb-2 text-cyan-400/60 animate-pulse" />
                  <p className="font-sans">No D-Scan pasted. Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-cyan-300">Ctrl+A</kbd> then <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-cyan-300">Ctrl+C</kbd> in your EVE Directional Scanner window to populate live radar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary Bar */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs ${
                    dscanReport.maxThreat === 'critical' ? 'bg-red-950/60 border-red-500 text-red-200' :
                    dscanReport.maxThreat === 'high' ? 'bg-orange-950/60 border-orange-500 text-orange-200' :
                    isDark ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300' : 'bg-sky-50 border-sky-300 text-sky-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span className="font-bold uppercase tracking-wider">
                        THREAT: {dscanReport.maxThreat}
                      </span>
                      <span>•</span>
                      <span>{dscanReport.totalItems} Total Contacts on Scan</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {dscanReport.bubbles.length > 0 && (
                        <span className="text-red-400 font-bold animate-pulse">
                          ⚠️ {dscanReport.bubbles.length} Bubbles
                        </span>
                      )}
                      {dscanReport.capitals.length > 0 && (
                        <span className="text-amber-400 font-bold">
                          💥 {dscanReport.capitals.length} Capitals
                        </span>
                      )}
                      {dscanReport.recons.length > 0 && (
                        <span className="text-purple-400 font-bold">
                          👁️ {dscanReport.recons.length} Recons
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Items Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {dscanReport.items.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                          item.shipInfo.threatLevel === 'critical' ? 'bg-red-950/40 border-red-800 text-red-200' :
                          item.shipInfo.threatLevel === 'high' ? 'bg-orange-950/30 border-orange-800 text-orange-200' :
                          isDark ? 'bg-[#0a0f1d] border-gray-800/80 text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold truncate text-white">{item.itemType}</div>
                          <div className="text-[10px] text-gray-400 truncate">"{item.itemName}"</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold text-cyan-400">{item.distanceStr}</span>
                          <div className="text-[9px] text-gray-500 uppercase">{item.shipInfo.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIGNATURES & ANOMALIES */}
          {activeSubTab === 'sigs' && (
            <div className="space-y-3">
              {/* Header Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                  <input
                    type="text"
                    placeholder="Paste probe scanner window here (Ctrl+A, Ctrl+C)..."
                    value={probeInput}
                    onChange={(e) => handleParseProbeScan(e.target.value)}
                    className={`w-full rounded-xl px-3 py-1.5 text-xs border focus:outline-none ${
                      isDark ? 'bg-black/80 border-gray-800 focus:border-amber-400 text-white placeholder-gray-600' : 'bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    onClick={() => setShowAddSigModal(!showAddSigModal)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1 shadow-sm whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sig</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1.5 text-xs">
                  {['all', 'wormhole', 'gas', 'relic', 'data', 'combat'].map(f => (
                    <button
                      key={f}
                      onClick={() => setSigFilter(f)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize transition-colors ${
                        sigFilter === f 
                          ? 'bg-amber-500 text-black' 
                          : isDark ? 'bg-gray-900 text-gray-400 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Add Modal Form */}
              {showAddSigModal && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 flex-wrap ${
                  isDark ? 'bg-[#0f172a] border-amber-500/50' : 'bg-amber-50 border-amber-300'
                }`}>
                  <input
                    type="text"
                    placeholder="Sig ID (e.g. AUC-104)"
                    value={newSigId}
                    onChange={(e) => setNewSigId(e.target.value)}
                    className="w-28 px-2 py-1 rounded bg-black border border-gray-700 text-white text-xs font-mono"
                  />
                  <select
                    value={newSigGroup}
                    onChange={(e) => setNewSigGroup(e.target.value as any)}
                    className="px-2 py-1 rounded bg-black border border-gray-700 text-white text-xs"
                  >
                    <option value="Wormhole">Wormhole</option>
                    <option value="Gas">Gas Site</option>
                    <option value="Relic">Relic Site</option>
                    <option value="Data">Data Site</option>
                    <option value="Ore">Ore Site</option>
                    <option value="Combat">Combat Anomaly</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Site Name (optional)"
                    value={newSigName}
                    onChange={(e) => setNewSigName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-black border border-gray-700 text-white text-xs"
                  />
                  <button
                    onClick={handleAddManualSig}
                    className="px-3 py-1 rounded bg-emerald-600 text-black font-bold text-xs"
                  >
                    Save
                  </button>
                </div>
              )}

              {/* Signatures Table */}
              {signaturesList.length === 0 ? (
                <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${
                  isDark ? 'border-gray-800 text-gray-500' : 'border-slate-300 text-slate-500'
                }`}>
                  <Compass className="w-6 h-6 mx-auto mb-2 text-amber-400/60 animate-spin-slow" />
                  <p className="font-sans">No signatures mapped for {selectedSystem.name} yet. Paste your in-game Probe Scanner list above (<kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-amber-300">Ctrl+A</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-amber-300">Ctrl+C</kbd>).</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden border-gray-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className={`text-[10px] uppercase border-b ${
                      isDark ? 'bg-black/60 text-gray-400 border-gray-800' : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Group / Type</th>
                        <th className="px-3 py-2">Site Name</th>
                        <th className="px-3 py-2">Signal</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {signaturesList.map((sig, idx) => {
                        const isWh = sig.type === 'Wormhole';
                        return (
                          <tr 
                            key={idx}
                            className={`hover:bg-cyan-950/20 transition-colors ${
                              isWh ? (isDark ? 'bg-cyan-950/10' : 'bg-sky-50/50') : ''
                            }`}
                          >
                            <td className="px-3 py-2 font-bold text-amber-400 font-mono">
                              {sig.sigId}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                sig.type === 'Wormhole' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                sig.type === 'Relic' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                sig.type === 'Data' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                sig.type === 'Gas' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                'bg-gray-800 text-gray-300'
                              }`}>
                                {sig.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-white font-medium">
                              {sig.name}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-gray-400">
                              {sig.signalPercent ? `${sig.signalPercent}%` : '100%'} {sig.distance ? `(${sig.distance})` : ''}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isWh && onLinkWormhole && (
                                  <button
                                    onClick={() => onLinkWormhole(sig)}
                                    className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[10px] flex items-center gap-1 shadow-sm"
                                    title="Add wormhole child connection to mapper"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>MAP HOLE</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteSig(sig.sigId)}
                                  className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
                                  title="Delete signature"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CITADELS & STRUCTURES */}
          {activeSubTab === 'structs' && (
            <div className="space-y-3">
              {(!selectedSystem.structures || selectedSystem.structures.length === 0) ? (
                <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${
                  isDark ? 'border-gray-800 text-gray-500' : 'border-slate-300 text-slate-500'
                }`}>
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-purple-400/60" />
                  <p className="font-sans">No citadels or starbases scouted in {selectedSystem.name} yet. D-Scan will automatically record any Astrahus, Fortizar, or Raitaru into this list.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {selectedSystem.structures.map((st, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-[#090d18] border-purple-900/60' : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{st.type}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">"{st.name}"</div>
                        <div className="text-[9px] text-gray-500 mt-1">Scouted by {st.scoutedBy || 'Fleet'} @ {st.timestamp}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-400">{st.distance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
