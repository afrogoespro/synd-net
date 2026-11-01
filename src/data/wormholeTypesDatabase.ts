export interface WormholeCodeInfo {
  code: string;
  destination: 'Highsec' | 'Lowsec' | 'Nullsec' | 'Class 1 (C1)' | 'Class 2 (C2)' | 'Class 3 (C3)' | 'Class 4 (C4)' | 'Class 5 (C5)' | 'Class 6 (C6)' | 'Pochven' | 'Incoming Exit (Unknown)';
  maxShipSize: 'Frigates / Destroyers (20M kg)' | 'Cruisers / Battlecruisers (62M kg)' | 'Battleships / Heavy (375M kg)' | 'Capitals / Freighters (1.8B kg)';
  totalMassCapacity: string;
  maxJumpMass: string;
  lifetimeHours: number;
  tacticalNote: string;
  isK162?: boolean;
}

export const WORMHOLE_CODES_DATABASE: Record<string, WormholeCodeInfo> = {
  // === INCOMING EXITS ===
  "K162": {
    code: "K162",
    destination: "Incoming Exit (Unknown)",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "Varies (Determined by outgoing side)",
    maxJumpMass: "Varies",
    lifetimeHours: 24,
    isK162: true,
    tacticalNote: "⚠️ INCOMING EXIT: This wormhole was opened from the OTHER side! Active scouts or a hostile fleet may have already jumped through or are camping the connection."
  },

  // === HIGHSEC CONNECTIONS ===
  "B274": {
    code: "B274",
    destination: "Highsec",
    maxShipSize: "Cruisers / Battlecruisers (62M kg)",
    totalMassCapacity: "1,000,000,000 kg",
    maxJumpMass: "62,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "Medium-mass Highsec exit. Battleships CANNOT pass through."
  },
  "D845": {
    code: "D845",
    destination: "Highsec",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "2,000,000,000 kg",
    maxJumpMass: "375,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "Heavy Highsec connection. Battleships, Orcas, and Heavy Haulers allowed."
  },
  "A982": {
    code: "A982",
    destination: "Highsec",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "3,000,000,000 kg",
    maxJumpMass: "375,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "High-capacity Highsec route."
  },

  // === LOWSEC CONNECTIONS ===
  "N110": {
    code: "N110",
    destination: "Lowsec",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "2,000,000,000 kg",
    maxJumpMass: "375,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "Lowsec exit. Check local intel immediately upon jumping for gatecamps."
  },
  "J244": {
    code: "J244",
    destination: "Lowsec",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "1,000,000,000 kg",
    maxJumpMass: "375,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "Standard Lowsec connection."
  },

  // === NULLSEC CONNECTIONS ===
  "E175": {
    code: "E175",
    destination: "Nullsec",
    maxShipSize: "Cruisers / Battlecruisers (62M kg)",
    totalMassCapacity: "1,000,000,000 kg",
    maxJumpMass: "62,000,000 kg",
    lifetimeHours: 16,
    tacticalNote: "Medium-mass Nullsec connection (Cruisers only). Watch for bubbles!"
  },
  "Z142": {
    code: "Z142",
    destination: "Nullsec",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "2,000,000,000 kg",
    maxJumpMass: "375,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "Heavy Nullsec connection. Battleship & Heavy Interdictor capable."
  },

  // === W-SPACE / J-SPACE CONNECTIONS ===
  "C247": {
    code: "C247",
    destination: "Class 3 (C3)",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "2,000,000,000 kg",
    maxJumpMass: "375,000,000 kg",
    lifetimeHours: 16,
    tacticalNote: "Direct connection to Class 3 Unknown space."
  },
  "X702": {
    code: "X702",
    destination: "Class 4 (C4)",
    maxShipSize: "Battleships / Heavy (375M kg)",
    totalMassCapacity: "2,000,000,000 kg",
    maxJumpMass: "375,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "Connection to Class 4 space. Dual statics typical."
  },
  "H296": {
    code: "H296",
    destination: "Class 5 (C5)",
    maxShipSize: "Capitals / Freighters (1.8B kg)",
    totalMassCapacity: "3,300,000,000 kg",
    maxJumpMass: "1,350,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "💥 CAPITAL CAPABLE: Dreadnoughts, Carriers, and Force Auxiliaries (FAX) can pass through this hole!"
  },
  "V928": {
    code: "V928",
    destination: "Class 5 (C5)",
    maxShipSize: "Capitals / Freighters (1.8B kg)",
    totalMassCapacity: "3,300,000,000 kg",
    maxJumpMass: "1,350,000,000 kg",
    lifetimeHours: 24,
    tacticalNote: "Capital-capable C5 wormhole."
  },
  "Z971": {
    code: "Z971",
    destination: "Class 1 (C1)",
    maxShipSize: "Cruisers / Battlecruisers (62M kg)",
    totalMassCapacity: "500,000,000 kg",
    maxJumpMass: "62,000,000 kg",
    lifetimeHours: 16,
    tacticalNote: "C1 space connection. Battleships cannot fit."
  }
};

// Recognizes wormhole codes from text, D-scan, or selected item clipboard
export function identifyWormholeCode(text: string): WormholeCodeInfo | null {
  if (!text) return null;
  const upper = text.toUpperCase();

  // 1. Direct K162 check (most common in EVE!)
  if (upper.includes("K162")) {
    return WORMHOLE_CODES_DATABASE["K162"];
  }

  // 2. Check for other known codes
  for (const [code, info] of Object.entries(WORMHOLE_CODES_DATABASE)) {
    // Match word boundaries: e.g. "H296" or "Wormhole H296" or "D845"
    const regex = new RegExp(`\\b${code}\\b`, 'i');
    if (regex.test(upper)) {
      return info;
    }
  }

  // 3. Generic unidentified wormhole
  if (upper.includes("WORMHOLE")) {
    return {
      code: "Unidentified Wormhole",
      destination: "Class 3 (C3)",
      maxShipSize: "Battleships / Heavy (375M kg)",
      totalMassCapacity: "Unknown",
      maxJumpMass: "Approach to < 5,000m to inspect designation code",
      lifetimeHours: 24,
      tacticalNote: "Wormhole detected on scan! Approach on grid to reveal specific code (e.g. K162, H296, D845)."
    };
  }

  return null;
}
