import React, { useState, useEffect } from 'react';
import { 
  Pickaxe, Search, AlertTriangle, ShieldCheck, Copy, Check, 
  ChevronRight, Target, Radio, Layers, Sword, ClipboardCheck,
  Sparkles, RefreshCw, Volume2, Coins, ExternalLink,
  Zap, FlaskConical, Database, Info, X, Filter
} from 'lucide-react';
import { ORE_AND_GAS_SITES, evaluateOreSite, EvaluatedOreSite, ORE_MINERAL_YIELDS, MineralYield } from '../data/oreDatabase';
import { parseProbeScanner, ProbeScanReport, ScannedSiteItem } from '../services/probeScannerParser';
import { scoutWatcher } from '../services/scoutWatcher';
import { playJackpotSound } from '../services/soundEffects';
import { marketPriceService } from '../services/marketPriceService';

export const OreSiteEvaluatorView: React.FC = () => {
  const [selectedSiteName, setSelectedSiteName] = useState<string>("Unexceptional Frontier Deposit");
  const [evaluatedSite, setEvaluatedSite] = useState<EvaluatedOreSite | null>(() => 
    evaluateOreSite("Unexceptional Frontier Deposit")
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [classFilter, setClassFilter] = useState<'all' | 'C2' | 'gas' | 'ore'>('ore');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [mineralFilter, setMineralFilter] = useState<string>('all');
  const [showMineralMatrixModal, setShowMineralMatrixModal] = useState<boolean>(false);
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  
  // Scanned sites from EVE probe scanner (live clipboard or pasted)
  const [scanReport, setScanReport] = useState<ProbeScanReport | null>(null);
  const [selectedScanSig, setSelectedScanSig] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [priceStatus, setPriceStatus] = useState<string>(() => marketPriceService.getLastUpdatedStr());
  const [isUpdatingPrices, setIsUpdatingPrices] = useState<boolean>(false);

  // Auto-fetch live Jita market prices on mount from CCP ESI
  useEffect(() => {
    marketPriceService.fetchLivePrices().then((updated) => {
      if (updated) {
        setPriceStatus(marketPriceService.getLastUpdatedStr());
        setEvaluatedSite(evaluateOreSite(selectedSiteName));
      }
    });
  }, [selectedSiteName]);

  const handleRefreshPrices = async () => {
    setIsUpdatingPrices(true);
    await marketPriceService.fetchLivePrices();
    setPriceStatus(marketPriceService.getLastUpdatedStr());
    setEvaluatedSite(evaluateOreSite(selectedSiteName));
    setIsUpdatingPrices(false);
  };

  const processScanReport = (report: ProbeScanReport) => {
    setScanReport(report);
    if (report.oreAndGasSites.length > 0) {
      const first = report.oreAndGasSites[0];
      setSelectedScanSig(first.id);
      if (first.name && ORE_AND_GAS_SITES[first.name]) {
        setSelectedSiteName(first.name);
        setEvaluatedSite(first.evaluatedOre || evaluateOreSite(first.name));
      }
    }

    // Play user's custom jackpot sound if high value site (>= 100M ISK) or rich system detected!
    const hasRichSite = report.oreAndGasSites.some(s => (s.evaluatedOre?.totalSiteValue || 0) >= 100000000);
    if (hasRichSite || report.totalOreValueInSystem >= 150000000) {
      playJackpotSound();
    }
  };

  // Subscribe to real-time OS clipboard scans from EVE client
  useEffect(() => {
    const unsub = scoutWatcher.onClipboardText((text) => {
      if (!text || text.trim().length < 5) return;
      
      const lower = text.toLowerCase();
      if (
        lower.includes('deposit') || 
        lower.includes('reservoir') || 
        lower.includes('ore site') || 
        lower.includes('combat site') ||
        lower.includes('frontier') ||
        lower.includes('perimeter')
      ) {
        const report = parseProbeScanner(text);
        if (report.oreAndGasSites.length > 0 || report.combatSites.length > 0) {
          processScanReport(report);
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSelectSite = (name: string, sigId?: string) => {
    setSelectedSiteName(name);
    setSelectedScanSig(sigId || null);
    const evaluated = evaluateOreSite(name);
    setEvaluatedSite(evaluated);
    if (evaluated && evaluated.totalSiteValue >= 100000000) {
      playJackpotSound();
    }
  };

  const handleSelectScannedSite = (item: ScannedSiteItem) => {
    setSelectedScanSig(item.id);
    if (item.evaluatedOre) {
      setSelectedSiteName(item.name);
      setEvaluatedSite(item.evaluatedOre);
    } else if (ORE_AND_GAS_SITES[item.name]) {
      setSelectedSiteName(item.name);
      setEvaluatedSite(evaluateOreSite(item.name));
    }
  };

  const handleManualParse = (input: string) => {
    if (!input.trim()) return;
    const report = parseProbeScanner(input);
    processScanReport(report);
  };

  const handleLoadSampleFromScreenshot = () => {
    const sample = `FKB-391\tUnexceptional Frontier Deposit\tOre Site\t100.0%\t2.457 m
AUC-100\tOrdinary Perimeter Deposit\tOre Site\t100.0%\t13.46 AU
NPF-592\tCommon Perimeter Deposit\tOre Site\t100.0%\t17.28 AU
XKP-894\tOutpost Frontier Stronghold\tCombat Site\t100.0%\t9.33 AU
TPK-381\tOutpost Frontier Stronghold\tCombat Site\t100.0%\t0.49 AU`;
    setRawInput(sample);
    handleManualParse(sample);
  };

  const formatIsk = (val: number): string => {
    if (val >= 1000000000) {
      return `${(val / 1000000000).toFixed(2)}B ISK`;
    }
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M ISK`;
    }
    return `${val.toLocaleString()} ISK`;
  };

  const handleCopyReport = async () => {
    if (!evaluatedSite) return;

    let text = `⛏️ **[SYND.NET MINING INTEL] ${evaluatedSite.siteName}**\n`;
    text += `💰 **Total Site Value:** ${formatIsk(evaluatedSite.totalSiteValue)}\n`;
    text += `⚠️ **Sleeper Threat:** ${evaluatedSite.sleeperHazard.description}\n\n`;
    text += `**Recommended Mining Priority (Best First):**\n`;

    evaluatedSite.rankedResources.forEach(r => {
      text += `#${r.rank} **${r.name}** - ${Math.round(r.iskPerM3).toLocaleString()} ISK/m³ (${formatIsk(r.totalValue)}) | ${r.priorityNote}\n`;
    });

    text += `\n*Scouted via Synd.net Recon Suite*`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const siteList = Object.keys(ORE_AND_GAS_SITES).filter(name => {
    const def = ORE_AND_GAS_SITES[name];
    if (searchFilter && !name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (classFilter === 'C2' && !def.whClasses.includes('C2')) return false;
    if (classFilter === 'gas' && def.category !== 'Wormhole Gas') return false;
    if (classFilter === 'ore' && def.category !== 'Wormhole Ore') return false;
    return true;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Header bar */}
      <div className="bg-[#0f1422] border border-cyan-900/40 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Pickaxe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                ORE &amp; GAS VALUATOR
              </h2>
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                SYND.NET C2 RECON
              </span>
            </div>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Copy from EVE's probe scanner without tabbing out — automatically parses all sites and calculates value
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playJackpotSound(true)}
            title="Test the High-Value Jackpot Audio Alert"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs flex items-center gap-1.5 transition-colors font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          >
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Test Sound</span>
          </button>

          <button
            onClick={() => setShowPasteBox(!showPasteBox)}
            className="px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs flex items-center gap-1.5 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 text-cyan-400" />
            <span>{showPasteBox ? 'Hide Paste Box' : 'Paste Scan Manually'}</span>
          </button>

          {evaluatedSite && (
            <button
              onClick={handleCopyReport}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] text-xs font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'REPORT COPIED!' : 'COPY REPORT'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Verified Reference & Live Market Status Bar */}
      <div className="bg-[#0b101d] border border-cyan-900/40 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Deposit Blueprints:</span>
            <span className="text-cyan-300 font-bold flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Verified C2 Ore Database
            </span>
          </div>

          <span className="text-gray-600 hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Pricing Source:</span>
            <span className="text-amber-300 font-bold flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Official CCP ESI (Tranquility)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-gray-400">Market Engine:</span>
            <span className="text-green-300 font-bold">{priceStatus}</span>
          </div>

          <button
            onClick={handleRefreshPrices}
            disabled={isUpdatingPrices}
            className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-mono flex items-center gap-1 transition-colors border border-gray-700"
            title="Fetch latest Jita 4-4 market prices from CCP ESI"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdatingPrices ? 'animate-spin text-cyan-400' : 'text-gray-400'}`} />
            <span>{isUpdatingPrices ? 'Syncing...' : 'Sync Live Prices'}</span>
          </button>
        </div>
      </div>
      {showPasteBox && (
        <div className="bg-[#0b0f19] border border-cyan-900/60 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="font-bold text-cyan-400">Paste Probe Scanner Rows:</span>
            <button
              onClick={handleLoadSampleFromScreenshot}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-sans flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Load My Scanned Sites (from Screenshot)
            </button>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste probe scanner lines here (Ctrl+V) e.g. AUC-100 Ordinary Perimeter Deposit Ore Site 100.0% 13.46 AU..."
            className="w-full h-24 bg-black/60 border border-gray-800 focus:border-cyan-500 rounded p-2.5 text-xs font-mono text-cyan-300 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setRawInput(''); setScanReport(null); }}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded"
            >
              Clear
            </button>
            <button
              onClick={() => handleManualParse(rawInput)}
              className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded"
            >
              Parse Scanned Sites
            </button>
          </div>
        </div>
      )}

      {/* LIVE SCANNED SITES BANNER (When probe scanner signatures are detected) */}
      {scanReport && (
        <div className="bg-gradient-to-r from-amber-950/40 via-[#0f1422] to-cyan-950/40 border-2 border-amber-500/50 rounded-2xl p-5 shadow-[0_0_25px_rgba(245,158,11,0.15)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                SCANNED SITES IN SYSTEM ({scanReport.totalSites} Detected)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-gray-400">Total System Mining Value:</span>
              <span className="text-amber-300 font-extrabold text-base">
                {formatIsk(scanReport.totalOreValueInSystem)}
              </span>
            </div>
          </div>

          {/* High Value Target Alert Notification Banner */}
          {scanReport.oreAndGasSites.some(s => s.evaluatedOre?.hasBistot) && (
            <div className="bg-gradient-to-r from-amber-500/20 via-amber-950/40 to-black/30 border-l-4 border-amber-400 p-3 rounded-r-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <div className="flex items-center gap-2">
                <span className="text-xl animate-bounce">💎</span>
                <div>
                  <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    HIGH VALUE ROCK INTEL: BISTOT DETECTED!
                  </div>
                  <div className="text-xs text-gray-300 font-sans mt-0.5">
                    Target rocks found: <strong className="text-amber-300">Bistot (98k ISK / 6,125 ISK/m³)</strong>, <strong className="text-emerald-300">Gneiss</strong>, and <strong className="text-indigo-300">Arkonor</strong>!
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/90 px-3 py-1 rounded-lg border border-amber-500 animate-pulse self-start sm:self-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                CHERRY-PICK BISTOT FIRST
              </span>
            </div>
          )}

          {/* Cards for each Scanned Ore/Gas Site */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scanReport.oreAndGasSites.map(site => {
              const isSelected = selectedScanSig === site.id || selectedSiteName === site.name;
              const val = site.evaluatedOre ? site.evaluatedOre.totalSiteValue : 0;
              const topOre = site.evaluatedOre?.rankedResources[0];

              return (
                <button
                  key={site.id}
                  onClick={() => handleSelectScannedSite(site)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-black/40 border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold text-amber-400 font-mono">
                        {site.id} • {site.distanceStr}
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5 truncate">
                        {site.name}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded shrink-0">
                      Ore Site
                    </span>
                  </div>

                  {/* High Value Rock Highlights (Bistot, Arkonor, Gneiss, Isogen) */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {site.evaluatedOre?.hasBistot && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse">
                        💎 Bistot
                      </span>
                    )}
                    {site.evaluatedOre?.hasGneiss && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600">
                        ⚡ Gneiss
                      </span>
                    )}
                    {site.evaluatedOre?.hasArkonor && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-600">
                        ⭐ Arkonor
                      </span>
                    )}
                    {site.evaluatedOre?.hasIsogen && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)] flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" /> Isogen
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">Value</div>
                      <div className="font-bold text-green-400">{formatIsk(val)}</div>
                    </div>
                    {topOre && (
                      <div className="text-right">
                        <div className="text-[10px] text-gray-400 uppercase">Best Rock</div>
                        <div className="font-bold text-cyan-300 truncate max-w-[100px]">{topOre.name}</div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Combat Sites in System if any */}
          {scanReport.combatSites.length > 0 && (
            <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-red-400 font-bold flex items-center gap-1">
                <Sword className="w-3.5 h-3.5" /> Combat Anomalies:
              </span>
              {scanReport.combatSites.map(c => (
                <span
                  key={c.id}
                  className="px-2 py-1 rounded bg-red-950/40 border border-red-900/60 text-red-200 text-[11px]"
                  title={c.threatSummary}
                >
                  {c.id} - {c.name} ({c.distanceStr})
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Selector List & Valuation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Selectable Site List with C2 quick filter */}
        <div className="bg-[#0f1422] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-800">
            <span>All Reference Sites:</span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => setClassFilter('C2')}
              className={`p-1.5 rounded text-center font-bold transition-colors ${
                classFilter === 'C2'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              C2 Wormholes
            </button>
            <button
              onClick={() => setClassFilter('gas')}
              className={`p-1.5 rounded text-center font-bold transition-colors ${
                classFilter === 'gas'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Gas Sites
            </button>
            <button
              onClick={() => setClassFilter('ore')}
              className={`p-1.5 rounded text-center font-bold transition-colors ${
                classFilter === 'ore'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Ore Sites
            </button>
            <button
              onClick={() => setClassFilter('all')}
              className={`p-1.5 rounded text-center font-bold transition-colors ${
                classFilter === 'all'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              All Sites
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search site name..."
              className="w-full bg-black/60 border border-gray-800 focus:border-cyan-500 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {siteList.map(name => {
              const isSelected = selectedSiteName === name;
              const def = ORE_AND_GAS_SITES[name];

              return (
                <button
                  key={name}
                  onClick={() => handleSelectSite(name)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-black/30 text-gray-300 border-gray-800/80 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <div className="truncate pr-1">
                    <div className="font-bold truncate">{name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-500 font-sans">{def.category}</span>
                      {def.resources.some(r => r.name.toLowerCase().includes('bistot')) && (
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1 rounded border border-amber-800">
                          💎 Bistot
                        </span>
                      )}
                      {def.resources.some(r => r.name.toLowerCase().includes('arkonor')) && (
                        <span className="text-[9px] font-bold text-indigo-300 bg-indigo-950/80 px-1 rounded border border-indigo-800">
                          ⭐ Arkonor
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-gray-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 3 Cols: Simple 3-Box Value & Priority View */}
        {evaluatedSite && (
          <div className="lg:col-span-3 space-y-5">
            {/* 3 Core Highlights (Simple Mode) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Box 1: Total Site Value */}
              <div className="bg-[#0f1422] border-2 border-amber-500/50 rounded-2xl p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-amber-400 uppercase font-bold flex items-center gap-1.5">
                    <Pickaxe className="w-4 h-4" /> TOTAL SITE VALUE
                  </div>
                  {evaluatedSite.totalSiteValue >= 100000000 && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-600 animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> JACKPOT (100M+)
                    </span>
                  )}
                </div>
                <div className="text-4xl font-extrabold text-white mt-1">
                  {formatIsk(evaluatedSite.totalSiteValue)}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 font-sans">
                  Total Volume: {evaluatedSite.totalVolumeM3.toLocaleString()} m³
                </div>
              </div>

              {/* Box 2: What to Mine First */}
              <div className="bg-[#0f1422] border-2 border-cyan-500/50 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="text-xs text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> WHAT TO MINE FIRST
                </div>
                <div className="text-2xl font-extrabold text-cyan-300 mt-1 truncate">
                  {evaluatedSite.rankedResources[0]?.name}
                </div>
                <div className="text-xs text-green-400 mt-1 font-bold">
                  {Math.round(evaluatedSite.rankedResources[0]?.iskPerM3).toLocaleString()} ISK / m³ (Best Density)
                </div>
              </div>

              {/* Box 3: Sleeper Hazard Status */}
              <div className={`border-2 rounded-2xl p-5 shadow-lg ${
                evaluatedSite.sleeperHazard.hasImmediateThreat
                  ? 'bg-red-950/20 border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : 'bg-green-950/20 border-green-500/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase font-bold flex items-center gap-1.5 text-white">
                    {evaluatedSite.sleeperHazard.hasImmediateThreat ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 animate-pulse" /> IMMEDIATE HAZARD
                      </span>
                    ) : (
                      <span className="text-green-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> 15-20 MIN SAFE WINDOW
                      </span>
                    )}
                  </div>
                  {evaluatedSite.sleeperHazard.peakDPS && (
                    <span className="text-[10px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                      Peak DPS: {evaluatedSite.sleeperHazard.peakDPS}
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-gray-200 mt-1 leading-snug">
                  {evaluatedSite.sleeperHazard.hasImmediateThreat
                    ? '⚠️ Sentry Guns on warp-in!'
                    : '🟢 Safe before Sleeper wave (~20m timer)'}
                </div>

                {evaluatedSite.sleeperHazard.waveBreakdown && (
                  <div className="text-[11px] text-amber-300/90 mt-1 font-mono truncate" title={evaluatedSite.sleeperHazard.waveBreakdown}>
                    Wave: {evaluatedSite.sleeperHazard.waveBreakdown}
                  </div>
                )}

                <div className="text-[11px] text-gray-400 mt-1 font-sans truncate">
                  {evaluatedSite.sleeperHazard.recommendedShip}
                </div>
              </div>
            </div>

            {/* Simple Ranked Mining Priority Card */}
            <div className="bg-[#0f1422] border border-gray-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedScanSig ? `${selectedScanSig} • ` : ''}{evaluatedSite.siteName}
                    <span className="text-xs font-normal text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      Mining Order (Best First)
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">
                    Highest profit per cargo hold listed at top. Cherry-pick the top resources before filling up.
                  </p>
                </div>

                <button
                  onClick={() => setShowMineralMatrixModal(true)}
                  className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  title="View complete mineral content breakdown for all EVE Online rocks"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mineral Yield Matrix</span>
                </button>
              </div>

              {/* Isogen Mineral Intel Alert Banner (User requested: which rock has what materials, such as isogen) */}
              {evaluatedSite.hasIsogen && (
                <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-[#071c26] to-[#090d16] border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                        ⚡ HIGH-VALUE ISOGEN ROCKS IN SITE!
                      </div>
                      <div className="text-xs text-slate-300 font-sans mt-0.5">
                        Found rocks yielding <strong className="text-cyan-300">Isogen</strong>: <strong className="text-white">{evaluatedSite.isogenRockNames.join(', ')}</strong>.
                        Gneiss is the top Isogen powerhouse (~2,000 units per batch)!
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMineralFilter(mineralFilter === 'isogen' ? 'all' : 'isogen')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        mineralFilter === 'isogen'
                          ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/50 ring-2 ring-cyan-300'
                          : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{mineralFilter === 'isogen' ? 'Showing Isogen Rocks' : 'Show Isogen Only'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Mineral Filter Pill Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3 text-cyan-400" /> Filter Mineral:
                  </span>
                  {[
                    { id: 'all', label: 'All Rocks', isSpecial: false },
                    { id: 'isogen', label: '⚡ Isogen', isSpecial: true },
                    { id: 'mexallon', label: 'Mexallon', isSpecial: false },
                    { id: 'zydrine', label: 'Zydrine', isSpecial: false },
                    { id: 'megacyte', label: 'Megacyte', isSpecial: false },
                    { id: 'nocxium', label: 'Nocxium', isSpecial: false }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMineralFilter(m.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                        mineralFilter === m.id
                          ? m.isSpecial
                            ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/50'
                            : 'bg-white text-slate-900 font-bold shadow-sm'
                          : m.isSpecial
                          ? 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
                          : 'bg-black/40 hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {mineralFilter !== 'all' && (
                  <button
                    onClick={() => setMineralFilter('all')}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Reset Filter
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {evaluatedSite.rankedResources
                  .filter(r => {
                    if (mineralFilter === 'all') return true;
                    return r.minerals && r.minerals.some(m => m.mineral.toLowerCase() === mineralFilter.toLowerCase());
                  })
                  .map(r => {
                  const isBistot = r.rockHighlightType === 'bistot';
                  const isGneiss = r.rockHighlightType === 'gneiss';
                  const isArkonor = r.rockHighlightType === 'arkonor';
                  const isRare = r.rockHighlightType === 'rare';

                  return (
                    <div
                      key={r.name}
                      className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                        isBistot
                          ? 'bg-gradient-to-r from-amber-950/60 via-[#181308] to-[#0f1422] border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/40'
                          : isGneiss
                          ? 'bg-gradient-to-r from-emerald-950/40 via-[#0a1612] to-[#090d16] border-2 border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : isArkonor
                          ? 'bg-gradient-to-r from-indigo-950/40 via-[#0e1122] to-[#090d16] border-2 border-indigo-500/70 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                          : isRare
                          ? 'bg-gradient-to-r from-purple-950/40 to-[#090d16] border border-purple-500/60'
                          : r.rank === 1
                          ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-[#090d16] border-gray-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            isBistot
                              ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
                              : isGneiss
                              ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : isArkonor
                              ? 'bg-indigo-400 text-black shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                              : r.rank === 1
                              ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                              : 'bg-gray-800 text-gray-300'
                          }`}>
                            #{r.rank}
                          </div>

                          <img
                            src={`https://images.evetech.net/types/${r.typeId}/icon?size=32`}
                            alt={r.name}
                            className={`w-9 h-9 rounded bg-black/60 shrink-0 border ${
                              isBistot
                                ? 'border-amber-400 ring-2 ring-amber-500/40'
                                : isGneiss
                                ? 'border-emerald-400'
                                : isArkonor
                                ? 'border-indigo-400'
                                : 'border-gray-800'
                            }`}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-bold text-base ${isBistot ? 'text-amber-200 text-lg font-mono' : isGneiss ? 'text-emerald-200' : isArkonor ? 'text-indigo-200' : 'text-white'}`}>
                                {r.name}
                              </span>
                              {r.highlightBadge ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  isBistot
                                    ? 'bg-amber-950 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                                    : isGneiss
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                    : isArkonor
                                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500'
                                    : 'bg-purple-950 text-purple-300 border-purple-500'
                                }`}>
                                  {r.highlightBadge}
                                </span>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  r.rank === 1
                                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                                    : 'bg-black/60 text-gray-400 border-gray-800'
                                }`}>
                                  {r.priorityNote}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-sans mt-0.5 flex flex-wrap items-center gap-3">
                              <span>{r.estimatedUnits.toLocaleString()} units ({ (r.estimatedUnits * r.unitVolumeM3).toLocaleString() } m³)</span>
                              {isBistot && <span className="text-amber-400 font-bold font-mono">⭐ CHERRY-PICK THIS ROCK FIRST!</span>}
                              <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Jita 4-4 ESI
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 text-right font-mono">
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase">Unit Price</div>
                            <div className={`text-xs font-bold ${isBistot ? 'text-amber-300' : 'text-gray-300'}`}>
                              {r.unitPrice.toLocaleString()} ISK
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-gray-500 uppercase">Profit Density</div>
                            <div className={`text-base font-bold ${isBistot ? 'text-amber-300 font-extrabold text-lg' : isGneiss ? 'text-emerald-400' : 'text-green-400'}`}>
                              {Math.round(r.iskPerM3).toLocaleString()} <span className="text-xs font-normal text-gray-400">ISK/m³</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-gray-500 uppercase">Total Value</div>
                            <div className={`text-base font-bold ${isBistot ? 'text-amber-300 font-extrabold text-lg' : 'text-amber-300'}`}>
                              {formatIsk(r.totalValue)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reprocess Mineral Breakdown Pills (User requested: which rock has what materials, such as isogen) */}
                      {r.minerals && r.minerals.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-white/5">
                          <span className="text-[10px] text-slate-400 font-sans uppercase font-bold flex items-center gap-1 mr-1">
                            <FlaskConical className="w-3 h-3 text-cyan-400" /> Reprocess (100 units):
                          </span>
                          {r.minerals.map(m => {
                            const isIso = m.mineral.toLowerCase() === 'isogen';
                            return (
                              <span
                                key={m.mineral}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                                  isIso
                                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/40'
                                    : m.isKey
                                    ? 'bg-amber-950/70 text-amber-200 border border-amber-500/60 font-bold'
                                    : 'bg-black/50 text-slate-300 border border-white/10'
                                }`}
                                title={`${r.name} yields ~${m.amount.toLocaleString()} ${m.mineral} per 100 units base`}
                              >
                                {isIso && <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400 animate-pulse" />}
                                <span>{m.mineral}:</span>
                                <span className={isIso ? 'text-cyan-300 font-bold' : 'text-slate-100'}>
                                  ~{m.amount.toLocaleString()}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      {/* New Eden Ore & Mineral Reprocess Matrix Modal */}
      {showMineralMatrixModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowMineralMatrixModal(false)}
        >
          <div 
            className="w-full max-w-4xl bg-[#090d16] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    New Eden Ore &amp; Mineral Matrix
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 font-mono">
                      100-Unit Batch Yields
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Which rock gives what materials? Easily track Isogen, Mexallon, Megacyte, and Zydrine sources.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMineralMatrixModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search & Filter */}
            <div className="py-3 flex flex-col sm:flex-row gap-3 border-b border-white/5 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  placeholder="Search rock (e.g. Gneiss, Bistot) or mineral (e.g. Isogen, Zydrine)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {['Isogen', 'Mexallon', 'Zydrine', 'Megacyte', 'Nocxium'].map(min => (
                  <button
                    key={min}
                    onClick={() => setMatrixSearch(matrixSearch.toLowerCase() === min.toLowerCase() ? '' : min)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      matrixSearch.toLowerCase() === min.toLowerCase()
                        ? min === 'Isogen'
                          ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/50'
                          : 'bg-white text-black font-bold'
                        : min === 'Isogen'
                        ? 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {min === 'Isogen' ? '⚡ ' + min : min}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5">
              {Object.entries(ORE_MINERAL_YIELDS)
                .filter(([oreName, yields]) => {
                  if (!matrixSearch.trim()) return true;
                  const q = matrixSearch.toLowerCase().trim();
                  if (oreName.toLowerCase().includes(q)) return true;
                  return yields.some(y => y.mineral.toLowerCase().includes(q));
                })
                .map(([oreName, yields]) => {
                  const hasIso = yields.some(y => y.mineral.toLowerCase() === 'isogen');
                  const isGneiss = oreName.toLowerCase().includes('gneiss');
                  const isBistot = oreName.toLowerCase().includes('bistot');
                  const isArkonor = oreName.toLowerCase().includes('arkonor');

                  // Location hints
                  let locationHint = 'Known Space & Highsec';
                  if (isGneiss) locationHint = '🌌 Wormhole (C1–C3) & Lowsec';
                  else if (isBistot) locationHint = '🌌 Wormhole (C1–C3) & Nullsec';
                  else if (isArkonor) locationHint = '🌌 Wormhole (C1–C3) & Nullsec';
                  else if (oreName === 'Kernite') locationHint = '🌌 Wormhole & High/Lowsec';
                  else if (oreName === 'Omber') locationHint = '🌌 Wormhole & High/Lowsec';
                  else if (oreName === 'Dark Ochre') locationHint = 'Deep Nullsec & WH';
                  else if (oreName === 'Hedbergite' || oreName === 'Hemorphite') locationHint = 'Lowsec & WH';
                  else if (oreName === 'Spodumain') locationHint = 'Nullsec & High-Class WH';

                  return (
                    <div
                      key={oreName}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isGneiss
                          ? 'bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-black/40 border-emerald-500/60 ring-1 ring-cyan-500/30'
                          : hasIso
                          ? 'bg-cyan-950/20 border-cyan-500/40'
                          : isBistot
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : isArkonor
                          ? 'bg-indigo-950/30 border-indigo-500/50'
                          : 'bg-black/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                          ⛏️
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{oreName}</span>
                            {hasIso && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)] flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" /> High Isogen
                              </span>
                            )}
                            {isGneiss && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-400">
                                ⭐ Top Pick
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                            {locationHint}
                          </div>
                        </div>
                      </div>

                      {/* Yields Breakdown */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {yields.map(y => {
                          const isIso = y.mineral.toLowerCase() === 'isogen';
                          return (
                            <span
                              key={y.mineral}
                              className={`text-xs font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                isIso
                                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold shadow-sm'
                                  : y.isKey
                                  ? 'bg-amber-950/70 text-amber-200 border border-amber-500/60 font-bold'
                                  : 'bg-black/60 text-slate-300 border border-white/10'
                              }`}
                            >
                              <span>{y.mineral}:</span>
                              <strong className={isIso ? 'text-cyan-300' : 'text-white'}>~{y.amount.toLocaleString()}</strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
              <span>* Base yields calculated per 100 units of ore before reprocessing skills / structure rigs.</span>
              <button
                onClick={() => setShowMineralMatrixModal(false)}
                className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
