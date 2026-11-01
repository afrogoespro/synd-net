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
