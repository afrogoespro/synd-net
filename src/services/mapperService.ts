import { ChainMapState, WormholeNode, WormholeConnection, ScannedStructure } from '../types/mapper';

export type MapUpdateCallback = (state: ChainMapState) => void;

class MapperService {
  private state: ChainMapState = {
    systems: {
      'Jita': {
        id: 'Jita',
        name: 'Jita',
        systemClass: 'Highsec',
        statics: [],
        structures: [],
        activePilots: ['You'],
        signatures: [],
        lastUpdated: new Date().toLocaleTimeString()
      }
    },
    connections: [],
    onlineBuddies: ['You']
  };

  private listeners: MapUpdateCallback[] = [];
  private activeSystemId: string = 'Jita';
  private eventSource: EventSource | null = null;

  constructor() {
    this.connectStream();
  }

  private connectStream() {
    try {
      this.eventSource = new EventSource('/api/map/stream');
      
      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'INIT' || data.type === 'MAP_UPDATE') {
            this.state = data.payload;
            this.notify();
          }
        } catch (err) {
          console.error("Map stream error:", err);
        }
      };

      this.eventSource.onerror = () => {
        // Fallback silently if sync server isn't running
      };
    } catch {}
  }

  public subscribe(cb: MapUpdateCallback) {
    this.listeners.push(cb);
    cb(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  public getState(): ChainMapState {
    return this.state;
  }

  public getActiveSystem(): WormholeNode | undefined {
    return this.state.systems[this.activeSystemId] || Object.values(this.state.systems)[0];
  }

  public setActiveSystem(systemId: string) {
    this.activeSystemId = systemId;
  }

  // Sync scanned structures to the shared map (for you and your buddy!)
  public async syncScannedStructures(systemId: string, structures: { name: string; type: string; distance: string }[]) {
    if (!systemId) return;

    const payload = {
      system: {
        id: systemId,
        name: systemId,
        systemClass: systemId.startsWith('J') ? 'C3' : 'Highsec'
      },
      structures: structures.map(s => ({
        name: s.name,
        type: s.type,
        distance: s.distance
      })),
      pilotName: 'You'
    };

    // Update locally immediately
    const existing = this.state.systems[systemId] || {
      id: systemId,
      name: systemId,
      systemClass: 'C3',
      statics: [],
      structures: [],
      activePilots: ['You'],
      signatures: [],
      lastUpdated: new Date().toLocaleTimeString()
    };

    structures.forEach(ns => {
      const idx = existing.structures.findIndex(s => s.name === ns.name);
      if (idx >= 0) {
        existing.structures[idx] = { ...existing.structures[idx], ...ns };
      } else {
        existing.structures.push({
          id: `struct-${Date.now()}-${Math.random()}`,
          name: ns.name,
          type: ns.type,
          distance: ns.distance,
          scoutedBy: 'You',
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });

    existing.lastUpdated = new Date().toLocaleTimeString();
    this.state.systems[systemId] = existing;
    this.activeSystemId = systemId;
    this.notify();

    // Broadcast to sync server for your buddy
    try {
      await fetch('/api/map/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}
  }

  // Manually add or connect a new wormhole system
  public async addWormholeConnection(fromSystem: string, toSystem: string, wormholeType?: string) {
    if (!toSystem.trim()) return;
    const cleanTo = toSystem.trim().toUpperCase();

    const payload = {
      system: {
        id: cleanTo,
        name: cleanTo,
        systemClass: cleanTo.startsWith('J') ? 'C3' : 'Highsec'
      },
      fromSystem,
      wormholeType: wormholeType || 'Wormhole',
      pilotName: 'You'
    };

    // Update local state
    if (!this.state.systems[cleanTo]) {
      this.state.systems[cleanTo] = {
        id: cleanTo,
        name: cleanTo,
        systemClass: cleanTo.startsWith('J') ? 'C3' : 'Highsec',
        statics: [],
        structures: [],
        activePilots: ['You'],
        signatures: [],
        lastUpdated: new Date().toLocaleTimeString()
      };
    }

    if (fromSystem && fromSystem !== cleanTo) {
      const exists = this.state.connections.some(
        c => (c.from === fromSystem && c.to === cleanTo) || (c.from === cleanTo && c.to === fromSystem)
      );
      if (!exists) {
        this.state.connections.push({
          id: `conn-${Date.now()}`,
          from: fromSystem,
          to: cleanTo,
          wormholeType: wormholeType || 'Wormhole',
          massStatus: 'stable',
          timeStatus: 'stable'
        });
      }
    }

    this.activeSystemId = cleanTo;
    this.notify();

    // Post to server for buddy
    try {
      await fetch('/api/map/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}
  }

  // Set a pilot's location (e.g. buddy sets their position to this system)
  public async setPilotLocation(pilotName: string, systemName: string) {
    if (!pilotName || !systemName) return;

    // Update local state immediately
    Object.values(this.state.systems).forEach(sys => {
      sys.activePilots = (sys.activePilots || []).filter(p => !p.startsWith(pilotName));
    });

    if (this.state.systems[systemName]) {
      this.state.systems[systemName].activePilots = this.state.systems[systemName].activePilots || [];
      if (!this.state.systems[systemName].activePilots.includes(pilotName)) {
        this.state.systems[systemName].activePilots.push(pilotName);
      }
    }
    this.notify();

    try {
      await fetch('/api/map/pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilotName, systemName })
      });
    } catch {}
  }

  public async clearMap() {
    this.state = {
      systems: {
        'Jita': {
          id: 'Jita',
          name: 'Jita',
          systemClass: 'Highsec',
          statics: [],
          structures: [],
          activePilots: ['You'],
          signatures: [],
          lastUpdated: new Date().toLocaleTimeString()
        }
      },
      connections: [],
      onlineBuddies: ['You']
    };
    this.activeSystemId = 'Jita';
    this.notify();

    try {
      await fetch('/api/map/clear', { method: 'POST' });
    } catch {}
  }
}

export const mapperService = new MapperService();
