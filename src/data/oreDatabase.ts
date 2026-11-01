import { marketPriceService } from '../services/marketPriceService';

export interface OreSiteDefinition {
  name: string;
  category: 'Wormhole Gas' | 'Wormhole Ore';
  whClasses: ('C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6')[];
  sleeperHazard: {
    hasImmediateThreat: boolean;
    spawnTimerMinutes?: number;
    peakDPS?: number;
    webCount?: number;
    neutCount?: number;
    waveBreakdown?: string;
    description: string;
    recommendedShip: string;
  };
  resources: {
    name: string;
    typeId: number;
    unitVolumeM3: number;
    units: number;
    estimatedPrice: number;
  }[];
}

export const ORE_AND_GAS_SITES: Record<string, OreSiteDefinition> = {
  // === WORMHOLE ORE SITES (Luke's Guide C2 Database with Real Jita 4-4 Pricing) ===
  "Unexceptional Frontier Deposit": {
    name: "Unexceptional Frontier Deposit",
    category: "Wormhole Ore",
    whClasses: ['C1', 'C2', 'C3'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 20,
      peakDPS: 79,
      webCount: 1,
      neutCount: 3,
      waveBreakdown: "1x Emergent Escort (Web), 2x Emergent Patroller, 2x Emergent Watchman (Neut: 3)",
      description: "🟢 Safe for 20 minutes! Sleeper wave (79 DPS, Web + Neuts) spawns at 20 mins.",
      recommendedShip: "Mining Barges / Exhumers (Mine Gneiss & Kernite first!) with combat escort for 20m wave"
    },
    resources: [
      { name: "Gneiss", typeId: 1229, unitVolumeM3: 5, units: 60000, estimatedPrice: 2199 },
      { name: "Kernite", typeId: 20, unitVolumeM3: 1.2, units: 400000, estimatedPrice: 517 },
      { name: "Bistot", typeId: 1223, unitVolumeM3: 16, units: 50000, estimatedPrice: 2350 },
      { name: "Arkonor", typeId: 22, unitVolumeM3: 16, units: 30000, estimatedPrice: 3238 },
      { name: "Omber", typeId: 1227, unitVolumeM3: 0.6, units: 400000, estimatedPrice: 110.5 }
    ]
  },
  "Common Perimeter Deposit": {
    name: "Common Perimeter Deposit",
    category: "Wormhole Ore",
    whClasses: ['C1', 'C2', 'C3'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 20,
      peakDPS: 80,
      waveBreakdown: "5x Emergent Patrollers",
      description: "🟢 Safe for 20 minutes! Sleeper wave (80 DPS) spawns at 20 mins.",
      recommendedShip: "Mining Barges / Exhumers (Mine Gneiss & Kernite first!)"
    },
    resources: [
      { name: "Gneiss", typeId: 1229, unitVolumeM3: 5, units: 40000, estimatedPrice: 2199 },
      { name: "Kernite", typeId: 20, unitVolumeM3: 1.2, units: 300000, estimatedPrice: 517 },
      { name: "Bistot", typeId: 1223, unitVolumeM3: 16, units: 30000, estimatedPrice: 2350 },
      { name: "Arkonor", typeId: 22, unitVolumeM3: 16, units: 20000, estimatedPrice: 3238 },
      { name: "Omber", typeId: 1227, unitVolumeM3: 0.6, units: 300000, estimatedPrice: 110.5 },
      { name: "Pyroxeres", typeId: 1224, unitVolumeM3: 0.3, units: 520000, estimatedPrice: 34 }
    ]
  },
  "Ordinary Perimeter Deposit": {
    name: "Ordinary Perimeter Deposit",
    category: "Wormhole Ore",
    whClasses: ['C1', 'C2', 'C3'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 20,
      peakDPS: 80,
      waveBreakdown: "Emergent Patrollers & Watchmen",
      description: "🟢 Safe for 20 minutes! Sleeper wave spawns at 20 mins.",
      recommendedShip: "Mining Barges / Exhumers (Mine Gneiss & Kernite first!)"
    },
    resources: [
      { name: "Gneiss", typeId: 1229, unitVolumeM3: 5, units: 20000, estimatedPrice: 2199 },
      { name: "Kernite", typeId: 20, unitVolumeM3: 1.2, units: 200000, estimatedPrice: 517 },
      { name: "Arkonor", typeId: 22, unitVolumeM3: 16, units: 10000, estimatedPrice: 3238 },
      { name: "Bistot", typeId: 1223, unitVolumeM3: 16, units: 20000, estimatedPrice: 2350 },
      { name: "Omber", typeId: 1227, unitVolumeM3: 0.6, units: 200000, estimatedPrice: 110.5 },
      { name: "Pyroxeres", typeId: 1224, unitVolumeM3: 0.3, units: 1620000, estimatedPrice: 34 }
    ]
  },
  "Average Frontier Deposit": {
    name: "Average Frontier Deposit",
    category: "Wormhole Ore",
    whClasses: ['C1', 'C2', 'C3'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 20,
      description: "🟢 Safe for 20 mins. 3x Emergent Defender frigates/cruisers spawn at 20 mins.",
      recommendedShip: "Mining Barges / Exhumers"
    },
    resources: [
      { name: "Dark Ochre", typeId: 1232, unitVolumeM3: 8, units: 15000, estimatedPrice: 11500 },
      { name: "Gneiss", typeId: 1229, unitVolumeM3: 5, units: 25000, estimatedPrice: 6800 },
      { name: "Pyroxeres", typeId: 1224, unitVolumeM3: 0.3, units: 120000, estimatedPrice: 320 },
      { name: "Veldspar", typeId: 1230, unitVolumeM3: 0.1, units: 350000, estimatedPrice: 95 }
    ]
  },
  "Uncommon Core Deposit": {
    name: "Uncommon Core Deposit",
    category: "Wormhole Ore",
    whClasses: ['C2', 'C3', 'C4', 'C5'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 20,
      description: "🟢 High-end nullsec ores (Arkonor & Bistot). Sleeper cruisers spawn at 20 mins.",
      recommendedShip: "Mining Barges / Exhumers (Covetor, Hulk, Mackinaw)"
    },
    resources: [
      { name: "Arkonor", typeId: 22, unitVolumeM3: 16, units: 18000, estimatedPrice: 22500 },
      { name: "Bistot", typeId: 1223, unitVolumeM3: 16, units: 22000, estimatedPrice: 18400 },
      { name: "Crokite", typeId: 1225, unitVolumeM3: 16, units: 19000, estimatedPrice: 17200 },
      { name: "Hedbergite", typeId: 21, unitVolumeM3: 3, units: 60000, estimatedPrice: 2800 }
    ]
  },
  "Infrequent Core Deposit": {
    name: "Infrequent Core Deposit",
    category: "Wormhole Ore",
    whClasses: ['C2', 'C3', 'C4'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 20,
      description: "🟢 Spodumain & Dark Ochre rocks! 3-4 Sleeper cruisers spawn at 20 mins.",
      recommendedShip: "Mining Barges / Exhumers"
    },
    resources: [
      { name: "Dark Ochre", typeId: 1232, unitVolumeM3: 8, units: 18000, estimatedPrice: 11500 },
      { name: "Spodumain", typeId: 19, unitVolumeM3: 16, units: 25000, estimatedPrice: 14200 },
      { name: "Jaspet", typeId: 1226, unitVolumeM3: 2, units: 45000, estimatedPrice: 1650 },
      { name: "Hemorphite", typeId: 1231, unitVolumeM3: 3, units: 35000, estimatedPrice: 2400 }
    ]
  },
  "Isolated Core Deposit": {
    name: "Isolated Core Deposit",
    category: "Wormhole Ore",
    whClasses: ['C3', 'C4', 'C5'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 20,
      description: "🟢 Rich Gneiss & Bistot cache. Heavy Sleeper cruisers spawn at 20 mins.",
      recommendedShip: "Heavy mining fleet with defense"
    },
    resources: [
      { name: "Bistot", typeId: 1223, unitVolumeM3: 16, units: 15000, estimatedPrice: 18400 },
      { name: "Dark Ochre", typeId: 1232, unitVolumeM3: 8, units: 15000, estimatedPrice: 11500 },
      { name: "Gneiss", typeId: 1229, unitVolumeM3: 5, units: 30000, estimatedPrice: 6800 },
      { name: "Crokite", typeId: 1225, unitVolumeM3: 16, units: 12000, estimatedPrice: 17200 }
    ]
  },
  "Exceptional Core Deposit": {
    name: "Exceptional Core Deposit",
    category: "Wormhole Ore",
    whClasses: ['C4', 'C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "⚠️ High value Spodumain & Mercoxit! Heavy Sleeper battleships spawn at 15 mins.",
      recommendedShip: "Heavy mining fleet with combat defense"
    },
    resources: [
      { name: "Mercoxit", typeId: 11396, unitVolumeM3: 0.1, units: 4500, estimatedPrice: 85000 },
      { name: "Spodumain", typeId: 19, unitVolumeM3: 16, units: 35000, estimatedPrice: 14200 },
      { name: "Dark Ochre", typeId: 1232, unitVolumeM3: 8, units: 25000, estimatedPrice: 11500 }
    ]
  },

  // === WORMHOLE GAS SITES (All variants) ===
  "Ordinary Perimeter Reservoir": {
    name: "Ordinary Perimeter Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: true,
      description: "⚠️ 5x Sleeper Sentry Guns already on grid at warp-in! Deals ~1,200 thermal/kinetic damage. Blow up sentries with an 80km+ sniper before mining.",
      recommendedShip: "Sniper Battlecruiser / Battleship (Kill towers first), then Ventures/Prospects"
    },
    resources: [
      { name: "Fullerite-C72", typeId: 30374, unitVolumeM3: 10, units: 3000, estimatedPrice: 58000 },
      { name: "Fullerite-C84", typeId: 30375, unitVolumeM3: 20, units: 1500, estimatedPrice: 28000 }
    ]
  },
  "Barren Perimeter Reservoir": {
    name: "Barren Perimeter Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 15-20 min safe window. Minor Sleeper frigate wave spawns afterward.",
      recommendedShip: "Solo Venture / Prospect"
    },
    resources: [
      { name: "Fullerite-C50", typeId: 30370, unitVolumeM3: 1, units: 3000, estimatedPrice: 5200 },
      { name: "Fullerite-C60", typeId: 30372, unitVolumeM3: 1, units: 1500, estimatedPrice: 3800 }
    ]
  },
  "Minor Perimeter Reservoir": {
    name: "Minor Perimeter Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 15-20 min safe window. Minor Sleeper wave at 15-20 mins.",
      recommendedShip: "Solo Venture / Prospect"
    },
    resources: [
      { name: "Fullerite-C50", typeId: 30370, unitVolumeM3: 1, units: 2500, estimatedPrice: 5200 },
      { name: "Fullerite-C70", typeId: 30373, unitVolumeM3: 1, units: 1500, estimatedPrice: 4800 }
    ]
  },
  "Sizeable Perimeter Reservoir": {
    name: "Sizeable Perimeter Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 15-20 min safe window. Small cruiser wave spawns at ~15 mins.",
      recommendedShip: "Ventures / Prospects"
    },
    resources: [
      { name: "Fullerite-C84", typeId: 30375, unitVolumeM3: 20, units: 1500, estimatedPrice: 28000 },
      { name: "Fullerite-C50", typeId: 30370, unitVolumeM3: 1, units: 3000, estimatedPrice: 5200 }
    ]
  },
  "Token Perimeter Reservoir": {
    name: "Token Perimeter Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 Safe 15 min window before small Sleeper escort spawns.",
      recommendedShip: "Solo Venture / Prospect"
    },
    resources: [
      { name: "Fullerite-C70", typeId: 30373, unitVolumeM3: 1, units: 3000, estimatedPrice: 4800 },
      { name: "Fullerite-C60", typeId: 30372, unitVolumeM3: 1, units: 1500, estimatedPrice: 3800 }
    ]
  },
  "Bountiful Frontier Reservoir": {
    name: "Bountiful Frontier Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C2', 'C3', 'C4', 'C5'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 15 minute safe window. 3-4 Sleeper Cruisers & Frigates spawn at ~15-20m.",
      recommendedShip: "Fleet Prospects / Combat Battlecruiser"
    },
    resources: [
      { name: "Fullerite-C28", typeId: 30371, unitVolumeM3: 2, units: 5000, estimatedPrice: 7500 },
      { name: "Fullerite-C450", typeId: 30376, unitVolumeM3: 10, units: 1000, estimatedPrice: 42000 }
    ]
  },
  "Vast Frontier Reservoir": {
    name: "Vast Frontier Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C2', 'C3', 'C4', 'C5'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 Highest value in C2/C3! Safe for 15-20 mins. 3-4 heavy Sleeper Battleships spawn afterward.",
      recommendedShip: "Prospects / Ninja Ventures (Warp out before 15m)"
    },
    resources: [
      { name: "Fullerite-C320", typeId: 30377, unitVolumeM3: 5, units: 3000, estimatedPrice: 125000 },
      { name: "Fullerite-C540", typeId: 30378, unitVolumeM3: 10, units: 1500, estimatedPrice: 220000 }
    ]
  },
  "Vital Core Reservoir": {
    name: "Vital Core Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 15 min safe window. 4x Sleeper Battleships spawn after 15-20 minutes.",
      recommendedShip: "Fleet Prospects / Ventures"
    },
    resources: [
      { name: "Fullerite-C320", typeId: 30377, unitVolumeM3: 5, units: 3000, estimatedPrice: 125000 },
      { name: "Fullerite-C540", typeId: 30378, unitVolumeM3: 10, units: 500, estimatedPrice: 220000 }
    ]
  },
  "Instrumental Core Reservoir": {
    name: "Instrumental Core Reservoir",
    category: "Wormhole Gas",
    whClasses: ['C5', 'C6'],
    sleeperHazard: {
      hasImmediateThreat: false,
      spawnTimerMinutes: 15,
      description: "🟢 Massive C-320 cache! 15-20 min timer before heavy Sleeper battleship wave.",
      recommendedShip: "Ninja Prospect fleet"
    },
    resources: [
      { name: "Fullerite-C320", typeId: 30377, unitVolumeM3: 5, units: 6000, estimatedPrice: 125000 },
      { name: "Fullerite-C540", typeId: 30378, unitVolumeM3: 10, units: 500, estimatedPrice: 220000 }
    ]
  }
};

export interface EvaluatedOreSite {
  siteName: string;
  category: string;
  whClasses: string[];
  totalSiteValue: number;
  totalVolumeM3: number;
  averageIskPerM3: number;
  sleeperHazard: OreSiteDefinition['sleeperHazard'];
  hasBistot: boolean;
  hasArkonor: boolean;
  hasGneiss: boolean;
  highValueRocks: { name: string; units: number; totalValue: number }[];
  rankedResources: {
    rank: number;
    name: string;
    typeId: number;
    unitVolumeM3: number;
    estimatedUnits: number;
    unitPrice: number;
    iskPerM3: number;
    totalValue: number;
    percentOfSiteValue: number;
    priorityNote: string;
    rockHighlightType?: 'bistot' | 'arkonor' | 'gneiss' | 'rare' | null;
    highlightBadge?: string | null;
  }[];
}

export function evaluateOreSite(siteName: string): EvaluatedOreSite | null {
  const clean = siteName.trim();
  const siteDef = ORE_AND_GAS_SITES[clean] || Object.values(ORE_AND_GAS_SITES).find(s => s.name.toLowerCase().includes(clean.toLowerCase()));

  if (!siteDef) return null;

  let totalSiteValue = 0;
  let totalVolumeM3 = 0;

  const resourcesEvaluated = siteDef.resources.map(r => {
    const liveUnitPrice = marketPriceService.getPrice(r.typeId, r.estimatedPrice);
    const totalVal = r.units * liveUnitPrice;
    const totalVol = r.units * r.unitVolumeM3;
    const iskPerM3 = liveUnitPrice / r.unitVolumeM3;

    totalSiteValue += totalVal;
    totalVolumeM3 += totalVol;

    return {
      name: r.name,
      typeId: r.typeId,
      unitVolumeM3: r.unitVolumeM3,
      estimatedUnits: r.units,
      unitPrice: liveUnitPrice,
      iskPerM3,
      totalValue: totalVal
    };
  });

  // Sort by BEST FIRST (highest ISK per m3 - maximum profit per cargo hold!)
  resourcesEvaluated.sort((a, b) => b.iskPerM3 - a.iskPerM3);

  const highValueRocks: { name: string; units: number; totalValue: number }[] = [];
  let hasBistot = false;
  let hasArkonor = false;
  let hasGneiss = false;

  const rankedResources = resourcesEvaluated.map((r, index) => {
    const percentOfSiteValue = totalSiteValue > 0 ? (r.totalValue / totalSiteValue) * 100 : 0;
    let priorityNote = 'Standard';
    if (index === 0) priorityNote = '⭐ #1 BEST TO MINE';
    else if (index === 1) priorityNote = 'High Priority';
    else priorityNote = 'Low Priority / Skip';

    const nameLower = r.name.toLowerCase();
    let rockHighlightType: 'bistot' | 'arkonor' | 'gneiss' | 'rare' | null = null;
    let highlightBadge: string | null = null;

    if (nameLower.includes('bistot')) {
      hasBistot = true;
      rockHighlightType = 'bistot';
      highlightBadge = '⭐ HIGH VALUE ORE: BISTOT';
      highValueRocks.push({ name: 'Bistot', units: r.estimatedUnits, totalValue: r.totalValue });
    } else if (nameLower.includes('arkonor')) {
      hasArkonor = true;
      rockHighlightType = 'arkonor';
      highlightBadge = '⭐ HIGH VALUE RARE: ARKONOR';
      highValueRocks.push({ name: 'Arkonor', units: r.estimatedUnits, totalValue: r.totalValue });
    } else if (nameLower.includes('gneiss')) {
      hasGneiss = true;
      rockHighlightType = 'gneiss';
      highlightBadge = '💎 TOP PROFIT DENSITY: GNEISS';
      highValueRocks.push({ name: 'Gneiss', units: r.estimatedUnits, totalValue: r.totalValue });
    } else if (nameLower.includes('mercoxit') || nameLower.includes('spodumain') || nameLower.includes('crokite')) {
      rockHighlightType = 'rare';
      highlightBadge = `💎 HIGH VALUE: ${r.name.toUpperCase()}`;
      highValueRocks.push({ name: r.name, units: r.estimatedUnits, totalValue: r.totalValue });
    }

    if (index === 0) {
      priorityNote = '⭐ #1 CHERRY-PICK FIRST (Highest ISK/m³)';
    }

    return {
      rank: index + 1,
      ...r,
      percentOfSiteValue,
      priorityNote,
      rockHighlightType,
      highlightBadge
    };
  });

  return {
    siteName: siteDef.name,
    category: siteDef.category,
    whClasses: siteDef.whClasses,
    totalSiteValue,
    totalVolumeM3,
    averageIskPerM3: totalVolumeM3 > 0 ? totalSiteValue / totalVolumeM3 : 0,
    sleeperHazard: siteDef.sleeperHazard,
    hasBistot,
    hasArkonor,
    hasGneiss,
    highValueRocks,
    rankedResources
  };
}
