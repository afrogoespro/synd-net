/**
 * EVE Online Inventory / Appraisal Parser & Live Jita Price Evaluator
 * Supports:
 * - Tab-delimited (View as Detail / Inventory table)
 * - Space-delimited (Name [tab or spaces] Quantity)
 * - Compressed Ore & Gas checks
 * - ESI live market pricing for Jita 4-4 with -10% buyback calculation
 */

export interface ParsedInventoryItem {
  id: string;
  name: string;
  typeId?: number;
  quantity: number;
  volumeM3?: number;
  isCompressed: boolean;
  isGas: boolean;
  isOre: boolean;
  isIce: boolean;
  isMineral: boolean;
  isEligible: boolean; // meets "compressed or gas/salvage/mineral" rule
  ineligibleReason?: string;
  jitaUnitPrice: number;
  jitaTotalValue: number;
  buybackUnitPrice: number;
  buybackTotalValue: number; // Jita - 10%
  unitVolumeM3?: number;
}

export interface AppraisalResult {
  items: ParsedInventoryItem[];
  totalJitaValue: number;
  totalBuybackValue: number; // 90% of Jita (-10%)
  totalVolumeM3: number;
  eligibleItemCount: number;
  ineligibleItemCount: number;
  allEligible: boolean;
  ratePercent: number; // e.g. 90% (which is -10%)
  marginISK: number; // 10% cut
  evaluatedAt: string;
}

// Fallback lookup table for common Compressed Ores, Fullerite Gases, Minerals & Salvage
export const BASELINE_JITA_PRICES: Record<string, { typeId: number; price: number; volume: number; isCompressed?: boolean; isGas?: boolean; isMineral?: boolean }> = {
  // === COMPRESSED ORES ===
  'compressed veldspar': { typeId: 62516, price: 1337, volume: 0.001, isCompressed: true },
  'compressed concentrated veldspar': { typeId: 62517, price: 1405, volume: 0.001, isCompressed: true },
  'compressed dense veldspar': { typeId: 62518, price: 1470, volume: 0.001, isCompressed: true },
  'compressed scordite': { typeId: 62519, price: 2840, volume: 0.0015, isCompressed: true },
  'compressed condensed scordite': { typeId: 62520, price: 2980, volume: 0.0015, isCompressed: true },
  'compressed massive scordite': { typeId: 62521, price: 3120, volume: 0.0015, isCompressed: true },
  'compressed pyroxeres': { typeId: 62522, price: 7120, volume: 0.003, isCompressed: true },
  'compressed solid pyroxeres': { typeId: 62523, price: 7480, volume: 0.003, isCompressed: true },
  'compressed viscous pyroxeres': { typeId: 62524, price: 7830, volume: 0.003, isCompressed: true },
  'compressed plagioclase': { typeId: 62525, price: 4450, volume: 0.0035, isCompressed: true },
  'compressed azure plagioclase': { typeId: 62526, price: 4670, volume: 0.0035, isCompressed: true },
  'compressed rich plagioclase': { typeId: 62527, price: 4890, volume: 0.0035, isCompressed: true },
  'compressed omber': { typeId: 62528, price: 11050, volume: 0.006, isCompressed: true },
  'compressed silvery omber': { typeId: 62529, price: 11600, volume: 0.006, isCompressed: true },
  'compressed golden omber': { typeId: 62530, price: 12150, volume: 0.006, isCompressed: true },
  'compressed kernite': { typeId: 62531, price: 51700, volume: 0.012, isCompressed: true },
  'compressed luminous kernite': { typeId: 62532, price: 54200, volume: 0.012, isCompressed: true },
  'compressed fiery kernite': { typeId: 62533, price: 56800, volume: 0.012, isCompressed: true },
  'compressed jaspet': { typeId: 62534, price: 62000, volume: 0.02, isCompressed: true },
  'compressed hemorphite': { typeId: 62537, price: 105900, volume: 0.03, isCompressed: true },
  'compressed hedbergite': { typeId: 62540, price: 340000, volume: 0.03, isCompressed: true },
  'compressed spodumain': { typeId: 62546, price: 1680000, volume: 0.16, isCompressed: true },
  'compressed dark ochre': { typeId: 62549, price: 3500000, volume: 0.08, isCompressed: true },
  'compressed gneiss': { typeId: 62552, price: 2199000, volume: 0.05, isCompressed: true },
  'compressed crokite': { typeId: 62558, price: 4619000, volume: 0.16, isCompressed: true },
  'compressed bistot': { typeId: 62564, price: 2350000, volume: 0.16, isCompressed: true },
  'compressed arkonor': { typeId: 62570, price: 3238000, volume: 0.16, isCompressed: true },
  'compressed mercoxit': { typeId: 62576, price: 2667000, volume: 0.4, isCompressed: true },

  // === FULLERITE WORMHOLE GASES (Naturally compact / uncompressible, 1-10 m3) ===
  'fullerite-c50': { typeId: 30370, price: 4999, volume: 1, isGas: true },
  'fullerite-c60': { typeId: 30371, price: 4621, volume: 1, isGas: true },
  'fullerite-c70': { typeId: 30372, price: 8494, volume: 1, isGas: true },
  'fullerite-c28': { typeId: 30373, price: 6349, volume: 2, isGas: true },
  'fullerite-c72': { typeId: 30374, price: 9099, volume: 2, isGas: true },
  'fullerite-c84': { typeId: 30375, price: 14870, volume: 2, isGas: true },
  'fullerite-c32': { typeId: 30376, price: 21160, volume: 5, isGas: true },
  'fullerite-c320': { typeId: 30377, price: 41000, volume: 5, isGas: true },
  'fullerite-c540': { typeId: 30378, price: 54700, volume: 10, isGas: true },

  // === REFINED MINERALS ===
  'tritanium': { typeId: 34, price: 4.85, volume: 0.01, isMineral: true },
  'pyerite': { typeId: 35, price: 14.2, volume: 0.01, isMineral: true },
  'mexallon': { typeId: 36, price: 82.5, volume: 0.01, isMineral: true },
  'isogen': { typeId: 37, price: 445.0, volume: 0.01, isMineral: true },
  'nocxium': { typeId: 38, price: 890.0, volume: 0.01, isMineral: true },
  'zydrine': { typeId: 39, price: 2150.0, volume: 0.01, isMineral: true },
  'megacyte': { typeId: 40, price: 4320.0, volume: 0.01, isMineral: true },
  'morphite': { typeId: 11399, price: 18450.0, volume: 0.01, isMineral: true }
};

// Raw uncompressed ore names that MUST be rejected or flagged
const RAW_ORE_NAMES = new Set([
  'veldspar', 'concentrated veldspar', 'dense veldspar',
  'scordite', 'condensed scordite', 'massive scordite',
  'pyroxeres', 'solid pyroxeres', 'viscous pyroxeres',
  'plagioclase', 'azure plagioclase', 'rich plagioclase',
  'omber', 'silvery omber', 'golden omber',
  'kernite', 'luminous kernite', 'fiery kernite',
  'jaspet', 'pure jaspet', 'pristine jaspet',
  'hemorphite', 'vivid hemorphite', 'radiant hemorphite',
  'hedbergite', 'glazed hedbergite', 'vitric hedbergite',
  'spodumain', 'bright spodumain', 'gleaming spodumain',
  'dark ochre', 'onyx ochre', 'obsidian ochre',
  'gneiss', 'iridescent gneiss', 'prismatic gneiss',
  'crokite', 'sharp crokite', 'crystalline crokite',
  'bistot', 'triclinic bistot', 'monoclinic bistot',
  'arkonor', 'crimson arkonor', 'prime arkonor',
  'mercoxit', 'magma mercoxit', 'vitreous mercoxit'
]);

/**
 * Parses raw text from EVE Online client inventory (Ctrl+A, Ctrl+C in View as Detail or table mode)
 */
export function parseInventoryText(rawText: string): { name: string; quantity: number; rawLine: string }[] {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/\r?\n/);
  const items: { name: string; quantity: number; rawLine: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip table header lines
    if (/^(name|item|quantity|group|category|size|slot|volume)\b/i.test(trimmed)) continue;

    // Check tab-delimited (Standard EVE inventory copy: "Name \t Quantity \t Group \t Category \t Size")
    if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 1) {
        const name = parts[0];
        let qty = 1;
        // Search parts for quantity number
        for (let i = 1; i < parts.length; i++) {
          const numClean = parts[i].replace(/[,\.\s]/g, '');
          if (/^\d+$/.test(numClean)) {
            const parsed = parseInt(numClean, 10);
            if (parsed > 0) {
              qty = parsed;
              break;
            }
          }
        }
        items.push({ name, quantity: qty, rawLine: trimmed });
        continue;
      }
    }

    // Space/number format: "Compressed Veldspar 50000" or "50000 Compressed Veldspar" or "Compressed Veldspar x50,000"
    const matchSuffix = trimmed.match(/^(.+?)\s+x?([\d,.\s]+)$/i);
    if (matchSuffix) {
      const name = matchSuffix[1].trim();
      const numClean = matchSuffix[2].replace(/[,\.\s]/g, '');
      if (/^\d+$/.test(numClean) && isNaN(Number(name))) {
        items.push({ name, quantity: parseInt(numClean, 10) || 1, rawLine: trimmed });
        continue;
      }
    }

    const matchPrefix = trimmed.match(/^([\d,.\s]+)x?\s+(.+)$/i);
    if (matchPrefix) {
      const numClean = matchPrefix[1].replace(/[,\.\s]/g, '');
      const name = matchPrefix[2].trim();
      if (/^\d+$/.test(numClean) && isNaN(Number(name))) {
        items.push({ name, quantity: parseInt(numClean, 10) || 1, rawLine: trimmed });
        continue;
      }
    }

    // Default 1 unit
    items.push({ name: trimmed, quantity: 1, rawLine: trimmed });
  }

  // Deduplicate and sum quantities
  const mergedMap = new Map<string, { name: string; quantity: number; rawLine: string }>();
  for (const item of items) {
    const key = item.name.toLowerCase();
    if (mergedMap.has(key)) {
      mergedMap.get(key)!.quantity += item.quantity;
    } else {
      mergedMap.set(key, { ...item });
    }
  }

  return Array.from(mergedMap.values());
}

/**
 * Resolves item type IDs and live Jita prices from ESI
 */
export async function evaluateAppraisal(
  rawText: string, 
  buybackDiscountPercent: number = 10
): Promise<AppraisalResult> {
  const parsedRows = parseInventoryText(rawText);
  if (parsedRows.length === 0) {
    return {
      items: [],
      totalJitaValue: 0,
      totalBuybackValue: 0,
      totalVolumeM3: 0,
      eligibleItemCount: 0,
      ineligibleItemCount: 0,
      allEligible: true,
      ratePercent: 100 - buybackDiscountPercent,
      marginISK: 0,
      evaluatedAt: new Date().toISOString()
    };
  }

  // 1. Resolve Type IDs from ESI universe/ids/ for any items not in local baseline
  const namesToResolve = parsedRows.map(r => r.name);
  const resolvedIds = new Map<string, number>();

  try {
    const res = await fetch('https://esi.evetech.net/latest/universe/ids/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(namesToResolve)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.inventory_types) {
        for (const it of data.inventory_types) {
          resolvedIds.set(it.name.toLowerCase(), it.id);
        }
      }
    }
  } catch (e) {
    console.warn('ESI universe/ids resolve error (using baseline fallback):', e);
  }

  // 2. Fetch live market prices from ESI for all resolved type IDs
  const allTypeIds = new Set<number>();
  for (const r of parsedRows) {
    const key = r.name.toLowerCase();
    const typeId = resolvedIds.get(key) || BASELINE_JITA_PRICES[key]?.typeId;
    if (typeId) allTypeIds.add(typeId);
  }

  const livePrices = new Map<number, number>();
  try {
    const pRes = await fetch('https://esi.evetech.net/latest/markets/prices/');
    if (pRes.ok) {
      const pData: { type_id: number; average_price?: number; adjusted_price?: number }[] = await pRes.json();
      for (const p of pData) {
        if (allTypeIds.has(p.type_id)) {
          const price = p.average_price || p.adjusted_price || 0;
          if (price > 0) livePrices.set(p.type_id, price);
        }
      }
    }
  } catch (e) {
    console.warn('ESI markets/prices error:', e);
  }

  // 3. Process each item and apply the "Compressed or Gas/Mineral" rule
  const items: ParsedInventoryItem[] = [];
  let totalJita = 0;
  let totalBuyback = 0;
  let totalVolume = 0;
  let eligibleCount = 0;
  let ineligibleCount = 0;

  for (const row of parsedRows) {
    const key = row.name.toLowerCase();
    const baseline = BASELINE_JITA_PRICES[key];
    const typeId = resolvedIds.get(key) || baseline?.typeId;
    
    // Check item category and compression status
    const isCompressed = key.startsWith('compressed ') || !!baseline?.isCompressed;
    const isGas = key.startsWith('fullerite') || key.includes(' gas') || !!baseline?.isGas;
    const isMineral = !!baseline?.isMineral || ['tritanium', 'pyerite', 'mexallon', 'isogen', 'nocxium', 'zydrine', 'megacyte', 'morphite'].includes(key);
    const isRawOre = RAW_ORE_NAMES.has(key) || (key.endsWith(' ore') && !isCompressed);

    // Rule requirement: "It has to be compressed or gas/salvage/mineral - uncompressed raw ore is rejected"
    let isEligible = true;
    let ineligibleReason: string | undefined = undefined;

    if (isRawOre) {
      isEligible = false;
      ineligibleReason = 'Raw Uncompressed Ore! Must compress ore at an Upwell structure before buyback.';
    }

    if (isEligible) {
      eligibleCount++;
    } else {
      ineligibleCount++;
    }

    // Determine Jita Unit Price (Live ESI > Baseline > 0)
    let unitPrice = 0;
    if (typeId && livePrices.has(typeId)) {
      unitPrice = livePrices.get(typeId)!;
    } else if (baseline?.price) {
      unitPrice = baseline.price;
    }

    const jitaTotal = unitPrice * row.quantity;
    const buybackUnit = unitPrice * ((100 - buybackDiscountPercent) / 100);
    const buybackTotal = isEligible ? (buybackUnit * row.quantity) : 0;
    const unitVol = baseline?.volume || (isCompressed ? 0.05 : isGas ? 2 : 0.01);
    const volTotal = unitVol * row.quantity;

    if (isEligible) {
      totalJita += jitaTotal;
      totalBuyback += buybackTotal;
      totalVolume += volTotal;
    }

    items.push({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: row.name,
      typeId,
      quantity: row.quantity,
      volumeM3: volTotal,
      unitVolumeM3: unitVol,
      isCompressed,
      isGas,
      isOre: isCompressed || isRawOre,
      isIce: key.includes('ice'),
      isMineral,
      isEligible,
      ineligibleReason,
      jitaUnitPrice: Math.round(unitPrice * 100) / 100,
      jitaTotalValue: Math.round(jitaTotal),
      buybackUnitPrice: Math.round(buybackUnit * 100) / 100,
      buybackTotalValue: Math.round(buybackTotal)
    });
  }

  return {
    items,
    totalJitaValue: Math.round(totalJita),
    totalBuybackValue: Math.round(totalBuyback),
    totalVolumeM3: Math.round(totalVolume * 100) / 100,
    eligibleItemCount: eligibleCount,
    ineligibleItemCount: ineligibleCount,
    allEligible: ineligibleCount === 0,
    ratePercent: 100 - buybackDiscountPercent,
    marginISK: Math.round(totalJita - totalBuyback),
    evaluatedAt: new Date().toISOString()
  };
}
