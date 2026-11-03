/**
 * EVE Online GalaxyFinder Route & Navigation Service
 * Calculates shortest paths, jump counts, and trade hub distances across live wormhole chain
 */

export interface TradeHubRoute {
  hubName: string;
  jumps: number | null;
  path: string[];
}

export const MAJOR_TRADE_HUBS = [
  { name: 'Jita', fullName: 'Jita IV - Moon 4 (Caldari Navy Assembly)' },
  { name: 'Amarr', fullName: 'Amarr VIII (Oris) - Emperor Family Academy' },
  { name: 'Dodixie', fullName: 'Dodixie IX - Moon 20 (Federation Navy Assembly)' },
  { name: 'Rens', fullName: 'Rens VI - Moon 8 (Brutor Tribe Treasury)' }
];

// BFS shortest path across live chain connections
export function findShortestRoute(
  connections: { from: string; to: string; wormholeType?: string }[],
  startSystem: string,
  targetSystem: string
): { jumps: number | null; path: string[] } {
  if (!startSystem || !targetSystem) return { jumps: null, path: [] };
  if (startSystem.toLowerCase() === targetSystem.toLowerCase()) {
    return { jumps: 0, path: [startSystem] };
  }

  const queue: { current: string; path: string[] }[] = [{ current: startSystem, path: [startSystem] }];
  const visited = new Set<string>([startSystem.toLowerCase()]);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current.toLowerCase() === targetSystem.toLowerCase()) {
      return { jumps: path.length - 1, path };
    }

    // Neighbors in undirected graph
    const neighbors = connections
      .filter(c => c.from.toLowerCase() === current.toLowerCase() || c.to.toLowerCase() === current.toLowerCase())
      .map(c => c.from.toLowerCase() === current.toLowerCase() ? c.to : c.from);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.toLowerCase())) {
        visited.add(neighbor.toLowerCase());
        queue.push({ current: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return { jumps: null, path: [] };
}

// Calculate routes to all major trade hubs
export function calculateTradeHubRoutes(
  connections: { from: string; to: string; wormholeType?: string }[],
  fromSystem: string
): TradeHubRoute[] {
  return MAJOR_TRADE_HUBS.map(hub => {
    const result = findShortestRoute(connections, fromSystem, hub.name);
    return {
      hubName: hub.name,
      jumps: result.jumps,
      path: result.path
    };
  });
}

// Known Wormhole Class Effects in EVE Online
export const WH_SYSTEM_EFFECTS: Record<string, { effect: string; color: string; desc: string }> = {
  'Wolf-Rayet': {
    effect: 'Wolf-Rayet Star',
    color: '#f59e0b',
    desc: '+Armor HP, +Small Weapon Damage, -Shield Signature Radius'
  },
  'Pulsar': {
    effect: 'Pulsar Star',
    color: '#06b6d4',
    desc: '+Shield Capacity, +Shield Resistances, -Capacitor Recharge Rate'
  },
  'Magnetar': {
    effect: 'Magnetar',
    color: '#ec4899',
    desc: '+Damage Multiplier, -Tracking Speed, -Target Painter Effectiveness'
  },
  'Cataclysmic': {
    effect: 'Cataclysmic Variable',
    color: '#8b5cf6',
    desc: '+Capacitor Capacity, -Remote Shield/Armor Rep Effectiveness'
  },
  'Red Giant': {
    effect: 'Red Giant',
    color: '#ef4444',
    desc: '+Overheat Damage Bonus, +Smartbomb Range & Damage'
  },
  'Black Hole': {
    effect: 'Black Hole',
    color: '#6366f1',
    desc: '+Ship Velocity, +Missile Velocity, -Inertia (Faster Align)'
  }
};

const SOLAR_SYSTEM_ID_CACHE = new Map<string, number>([
  ['jita', 30000142],
  ['amarr', 30002187],
  ['dodixie', 30002659],
  ['rens', 30002510],
  ['sobaseki', 30001363],
  ['veisto', 30001364],
  ['iidoken', 30001365],
  ['uemisaisen', 30001366],
  ['sagain', 30002693],
  ['ikuchi', 30000140],
  ['new caldari', 30000144],
  ['thera', 31000005],
]);

export async function resolveSolarSystemId(systemName: string): Promise<number | null> {
  if (!systemName) return null;
  const key = systemName.trim().toLowerCase();
  if (SOLAR_SYSTEM_ID_CACHE.has(key)) return SOLAR_SYSTEM_ID_CACHE.get(key)!;

  try {
    const res = await fetch('https://esi.evetech.net/latest/universe/ids/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([systemName.trim()])
    });
    if (res.ok) {
      const data = await res.json();
      if (data.systems && data.systems.length > 0) {
        const id = data.systems[0].id;
        SOLAR_SYSTEM_ID_CACHE.set(key, id);
        return id;
      }
    }
  } catch (e) {
    console.error('Failed to resolve solarSystemId:', e);
  }
  return null;
}
