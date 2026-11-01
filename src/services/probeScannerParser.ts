import { ORE_AND_GAS_SITES, evaluateOreSite, EvaluatedOreSite } from '../data/oreDatabase';
import { parseDistance } from './dscanParser';

export interface ScannedSiteItem {
  id: string; // e.g. AUC-100
  rawLine: string;
  name: string;
  group: 'Ore Site' | 'Gas Site' | 'Combat Site' | 'Relic Site' | 'Data Site' | 'Wormhole' | 'Unknown';
  signalPercent?: number; // e.g. 100
  distanceStr: string;
  distanceAU: number;
  evaluatedOre?: EvaluatedOreSite | null;
  isOreOrGas: boolean;
  threatSummary?: string;
}

export interface ProbeScanReport {
  timestamp: string;
  totalSites: number;
  oreAndGasSites: ScannedSiteItem[];
  combatSites: ScannedSiteItem[];
  wormholes: ScannedSiteItem[];
  otherSites: ScannedSiteItem[];
  totalOreValueInSystem: number;
}

// Known combat sites for wormhole space with threat descriptions
const KNOWN_COMBAT_SITES: Record<string, string> = {
  'Outpost Frontier Stronghold': '⚔️ C2/C3 Sleeper Stronghold (4 waves, Awakened Cruisers & Battleships)',
  'Perimeter Ambush Point': '⚔️ C1/C2 Sleeper Camp (Light frigates & cruisers)',
  'Perimeter Camp': '⚔️ C1/C2 Sleeper Base',
  'Solar Cell': '⚔️ C2 Sleeper Relay',
  'The Ruins of Enclave Glory': '⚔️ C3 Heavy Combat Anomaly',
  'Fortification Frontier Stronghold': '⚔️ C3 Combat Site (Heavy Awakened Defenders)'
};

// Fuzzy match site name against known ore/gas database
export function matchOreSiteName(rawName: string): string | null {
  const clean = rawName.trim().toLowerCase();
  
  // Exact or prefix match
  for (const siteName of Object.keys(ORE_AND_GAS_SITES)) {
    const siteLower = siteName.toLowerCase();
    if (siteLower === clean || siteLower.startsWith(clean) || clean.startsWith(siteLower)) {
      return siteName;
    }
    // Also test without suffix ("Deposit", "Reservoir")
    const baseSite = siteLower.replace(/\s+(deposit|reservoir)$/i, '').trim();
    if (clean.includes(baseSite) || baseSite.includes(clean)) {
      return siteName;
    }
  }

  return null;
}

export function parseProbeScanner(rawText: string): ProbeScanReport {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const items: ScannedSiteItem[] = [];

  for (const line of lines) {
    // Check if line looks like probe scanner
    // Format usually has tabs or multiple spaces:
    // AUC-100 \t Ordinary Perimeter Deposit \t Ore Site \t 100.0% \t 13.46 AU
    // or: 13.46 AU \t AUC-10 \t Ordinary Perimeter De \t Ore Site
    const parts = line.split('\t').map(p => p.trim());
    const spaceParts = line.split(/\s{2,}/).map(p => p.trim());
    const tokens = parts.length > 1 ? parts : (spaceParts.length > 1 ? spaceParts : line.split(/\s+/));

    // Look for Signature ID (e.g. AUC-100, NPF-591, FKB-39, XKP-89)
    const idMatch = line.match(/\b([A-Z]{3}-\d{2,3})\b/i);
    const sigId = idMatch ? idMatch[1].toUpperCase() : '';

    // Look for Distance (e.g. 13.46 AU, 2.457 m, 500 km)
    const distMatch = line.match(/([\d\.,\s]+(?:AU|km|m))\b/i);
    const distanceRaw = distMatch ? distMatch[1].trim() : '-';
    const { formatted, au } = parseDistance(distanceRaw);

    // Look for Signal % (e.g. 100.0% or 100%)
    const signalMatch = line.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
    const signalPercent = signalMatch ? parseFloat(signalMatch[1]) : undefined;

    // Detect Group
    let group: ScannedSiteItem['group'] = 'Unknown';
    const lineLower = line.toLowerCase();
    if (lineLower.includes('ore site') || lineLower.includes('deposit')) group = 'Ore Site';
    else if (lineLower.includes('gas site') || lineLower.includes('reservoir')) group = 'Gas Site';
    else if (lineLower.includes('combat site') || lineLower.includes('stronghold') || lineLower.includes('ambush')) group = 'Combat Site';
    else if (lineLower.includes('relic site')) group = 'Relic Site';
    else if (lineLower.includes('data site')) group = 'Data Site';
    else if (lineLower.includes('wormhole')) group = 'Wormhole';

    // Extract site name
    let extractedName = '';
    
    // Check known Ore/Gas first
    for (const knownOre of Object.keys(ORE_AND_GAS_SITES)) {
      const base = knownOre.toLowerCase().replace(/\s+(deposit|reservoir)$/i, '');
      if (lineLower.includes(knownOre.toLowerCase()) || lineLower.includes(base)) {
        extractedName = knownOre;
        if (ORE_AND_GAS_SITES[knownOre].category === 'Wormhole Ore') group = 'Ore Site';
        else if (ORE_AND_GAS_SITES[knownOre].category === 'Wormhole Gas') group = 'Gas Site';
        break;
      }
    }

    // Check known combat sites
    if (!extractedName) {
      for (const [combatSite, threat] of Object.entries(KNOWN_COMBAT_SITES)) {
        const base = combatSite.toLowerCase().slice(0, 15);
        if (lineLower.includes(combatSite.toLowerCase()) || lineLower.includes(base)) {
          extractedName = combatSite;
          group = 'Combat Site';
          break;
        }
      }
    }

    // If still no known name, try extracting from column tokens
    if (!extractedName) {
      for (const t of tokens) {
        if (
          !t.match(/^[A-Z]{3}-\d{2,3}$/i) &&
          !t.match(/^[\d\.,\s]+(AU|km|m)$/i) &&
          !t.match(/^\d+.*%$/) &&
          !['ore site', 'gas site', 'combat site', 'relic site', 'data site', 'wormhole', 'cosmic anomaly', 'cosmic signature'].includes(t.toLowerCase())
        ) {
          if (t.length > 3) {
            extractedName = t;
            break;
          }
        }
      }
    }

    if (!extractedName && !sigId && group === 'Unknown') {
      continue; // Skip lines that aren't scanner rows
    }

    // Try evaluating ore if it's an ore or gas site
    let evaluatedOre: EvaluatedOreSite | null = null;
    const isOreOrGas = group === 'Ore Site' || group === 'Gas Site' || (extractedName ? !!matchOreSiteName(extractedName) : false);

    if (isOreOrGas && extractedName) {
      const canonicalName = matchOreSiteName(extractedName);
      if (canonicalName) {
        evaluatedOre = evaluateOreSite(canonicalName);
        extractedName = canonicalName;
      }
    }

    let threatSummary = undefined;
    if (group === 'Combat Site' && extractedName) {
      threatSummary = KNOWN_COMBAT_SITES[extractedName] || '⚔️ Combat Anomaly';
    }

    items.push({
      id: sigId || `SIG-${Math.floor(Math.random() * 900 + 100)}`,
      rawLine: line,
      name: extractedName || (group !== 'Unknown' ? group : 'Cosmic Signature'),
      group,
      signalPercent,
      distanceStr: formatted,
      distanceAU: au,
      evaluatedOre,
      isOreOrGas,
      threatSummary
    });
  }

  const oreAndGasSites = items.filter(i => i.isOreOrGas);
  const combatSites = items.filter(i => i.group === 'Combat Site');
  const wormholes = items.filter(i => i.group === 'Wormhole');
  const otherSites = items.filter(i => !i.isOreOrGas && i.group !== 'Combat Site' && i.group !== 'Wormhole');

  const totalOreValueInSystem = oreAndGasSites.reduce((sum, s) => {
    return sum + (s.evaluatedOre ? s.evaluatedOre.totalSiteValue : 0);
  }, 0);

  return {
    timestamp: new Date().toLocaleTimeString(),
    totalSites: items.length,
    oreAndGasSites,
    combatSites,
    wormholes,
    otherSites,
    totalOreValueInSystem
  };
}
