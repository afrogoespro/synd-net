import { ChainMapState, WormholeNode, WormholeConnection, ScannedStructure, WormholeSignature, StructureTimer } from '../types/mapper';

export type MapUpdateCallback = (state: ChainMapState) => void;
export type JumpCallback = (jumpData: { systemName: string; fromSystem?: string; isWormhole?: boolean }) => void;

function getEveTime(): string {
  return new Date().toISOString().slice(11, 16);
}

const DEFAULT_SYSTEMS: Record<string, WormholeNode> = {
  'Jita': { id: 'Jita', name: 'Jita', systemClass: 'Highsec', region: 'The Forge', security: 0.9, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 650, y: 40 },
  'Ikuchi': { id: 'Ikuchi', name: 'Ikuchi', systemClass: 'Highsec', region: 'The Forge', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 130 },
  'Ansila': { id: 'Ansila', name: 'Ansila', systemClass: 'Highsec', region: 'The Forge', security: 0.9, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 220 },
  'Hykkota': { id: 'Hykkota', name: 'Hykkota', systemClass: 'Highsec', region: 'The Forge', security: 0.8, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 310 },
  'J151141': { id: 'J151141', name: 'J151141', systemClass: 'C1', region: 'W-Space', sigCode: 'YSO', statics: ['Highsec'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 400 },
  'Muvolailen': { id: 'Muvolailen', name: 'Muvolailen', systemClass: 'Highsec', region: 'The Citadel', security: 0.7, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 330, y: 130 },
  'Sobaseki': { id: 'Sobaseki', name: 'Sobaseki', systemClass: 'Highsec', region: 'Lonetrek', security: 0.8, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 470, y: 130 },
  'Isanamo': { id: 'Isanamo', name: 'Isanamo', systemClass: 'Highsec', region: 'Lonetrek', security: 0.6, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 470, y: 220 },
  'Uemisaisen': { id: 'Uemisaisen', name: 'Uemisaisen', systemClass: 'Highsec', region: 'Lonetrek', security: 0.6, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 470, y: 310 },
  'J103955': { id: 'J103955', name: 'J103955', systemClass: 'C3', region: 'W-Space', sigCode: 'JVC', statics: ['Lowsec'], structures: [], activePilots: ['Syndra en Tilavine', 'USS Hauler'], signatures: [], lastUpdated: '22:45', x: 410, y: 400 },
  'J142349': { id: 'J142349', name: 'J142349', systemClass: 'C5', region: 'W-Space', sigCode: 'JPV', statics: ['C3'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 410, y: 490 },
  'New Caldari': { id: 'New Caldari', name: 'New Caldari', systemClass: 'Highsec', region: 'The Forge', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 130 },
  'Alikara': { id: 'Alikara', name: 'Alikara', systemClass: 'Highsec', region: 'The Citadel', security: 0.7, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 220 },
  'J101817': { id: 'J101817', name: 'J101817', systemClass: 'C1', region: 'W-Space', sigCode: 'ISA', statics: ['Highsec'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 880, y: 220 },
  'J204842': { id: 'J204842', name: 'J204842', systemClass: 'C3', region: 'W-Space', sigCode: 'XSX', statics: ['Lowsec'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 310 },
  'J123947': { id: 'J123947', name: 'J123947', systemClass: 'C4', region: 'W-Space', sigCode: 'RCO', statics: ['C3', 'C4'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 620, y: 400 },
  'J155214': { id: 'J155214', name: 'J155214', systemClass: 'C4', region: 'W-Space', sigCode: 'MFD', statics: ['C3', 'C2'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 790, y: 400 },
  'Atlar': { id: 'Atlar', name: 'Atlar', systemClass: 'Lowsec', region: 'Molden Heath', security: 0.4, sigCode: 'UCY', statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 490 },
  'Perimeter': { id: 'Perimeter', name: 'Perimeter', systemClass: 'Highsec', region: 'The Forge', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 990, y: 130 },
  'Niyabainen': { id: 'Niyabainen', name: 'Niyabainen', systemClass: 'Highsec', region: 'The Forge', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 990, y: 220 },
  'Maurasi': { id: 'Maurasi', name: 'Maurasi', systemClass: 'Highsec', region: 'The Forge', security: 0.9, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 1120, y: 130 },
  'Urlen': { id: 'Urlen', name: 'Urlen', systemClass: 'Highsec', region: 'The Forge', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 1120, y: 220 }
};

const DEFAULT_CONNECTIONS: WormholeConnection[] = [
  { id: 'c-jita-ikuchi', from: 'Jita', to: 'Ikuchi', wormholeType: 'Stargate' },
  { id: 'c-ikuchi-ansila', from: 'Ikuchi', to: 'Ansila', wormholeType: 'Stargate' },
  { id: 'c-ansila-hykkota', from: 'Ansila', to: 'Hykkota', wormholeType: 'Stargate' },
  { id: 'c-hykkota-j151141', from: 'Hykkota', to: 'J151141', wormholeType: 'Wormhole', sigFrom: 'YSO' },
  { id: 'c-jita-muvolailen', from: 'Jita', to: 'Muvolailen', wormholeType: 'Stargate' },
  { id: 'c-jita-sobaseki', from: 'Jita', to: 'Sobaseki', wormholeType: 'Stargate' },
  { id: 'c-sobaseki-isanamo', from: 'Sobaseki', to: 'Isanamo', wormholeType: 'Stargate' },
  { id: 'c-isanamo-uemisaisen', from: 'Isanamo', to: 'Uemisaisen', wormholeType: 'Stargate' },
  { id: 'c-uemisaisen-j103955', from: 'Uemisaisen', to: 'J103955', wormholeType: 'Wormhole', sigFrom: 'ANF' },
  { id: 'c-j103955-j142349', from: 'J103955', to: 'J142349', wormholeType: 'Wormhole', sigFrom: 'JPV' },
  { id: 'c-jita-newcaldari', from: 'Jita', to: 'New Caldari', wormholeType: 'Stargate' },
  { id: 'c-newcaldari-alikara', from: 'New Caldari', to: 'Alikara', wormholeType: 'Stargate' },
  { id: 'c-alikara-j101817', from: 'Alikara', to: 'J101817', wormholeType: 'Wormhole', sigFrom: 'ISA' },
  { id: 'c-alikara-j204842', from: 'Alikara', to: 'J204842', wormholeType: 'Wormhole', sigFrom: 'HMV' },
  { id: 'c-j204842-j123947', from: 'J204842', to: 'J123947', wormholeType: 'Wormhole', sigFrom: 'RCO' },
  { id: 'c-j204842-j155214', from: 'J204842', to: 'J155214', wormholeType: 'Wormhole', sigFrom: 'MFD' },
  { id: 'c-j204842-atlar', from: 'J204842', to: 'Atlar', wormholeType: 'Wormhole', sigFrom: 'UCY' },
  { id: 'c-jita-perimeter', from: 'Jita', to: 'Perimeter', wormholeType: 'Stargate' },
  { id: 'c-perimeter-niyabainen', from: 'Perimeter', to: 'Niyabainen', wormholeType: 'Stargate' },
  { id: 'c-jita-maurasi', from: 'Jita', to: 'Maurasi', wormholeType: 'Stargate' },
  { id: 'c-maurasi-urlen', from: 'Maurasi', to: 'Urlen', wormholeType: 'Stargate' }
];

class MapperService {
  private state: ChainMapState = {
    systems: { ...DEFAULT_SYSTEMS },
    connections: [ ...DEFAULT_CONNECTIONS ],
    onlineBuddies: []
  };

  private listeners: MapUpdateCallback[] = [];
  private jumpListeners: JumpCallback[] = [];
  private activeSystemId: string = 'J103955';
  private eventSource: EventSource | null = null;

  constructor() {
    this.fetchInitialState();
    this.connectStream();
  }

  private async fetchInitialState() {
    try {
      const res = await fetch('/api/map');
      if (res.ok) {
        const data = await res.json();
        if (data && data.systems) {
          this.state = data;
          this.notify();
        }
      }
    } catch {}
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
          if (data.type === 'JUMP' && data.payload) {
            this.activeSystemId = data.payload.systemName;
            this.jumpListeners.forEach(cb => cb(data.payload));
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

  public onJump(cb: JumpCallback) {
    this.jumpListeners.push(cb);
    return () => {
      this.jumpListeners = this.jumpListeners.filter(l => l !== cb);
    };
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
      lastUpdated: getEveTime()
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
          timestamp: getEveTime()
        });
      }
    });

    existing.lastUpdated = getEveTime();
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
  public async addWormholeConnection(fromSystem: string, toSystem: string, wormholeType?: string, sigFrom?: string) {
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
        lastUpdated: getEveTime()
      };
    }

    if (fromSystem && fromSystem !== cleanTo) {
      const exists = this.state.connections.find(
        c => (c.from === fromSystem && c.to === cleanTo) || (c.from === cleanTo && c.to === fromSystem)
      );
      if (!exists) {
        this.state.connections.push({
          id: `conn-${Date.now()}`,
          from: fromSystem,
          to: cleanTo,
          wormholeType: wormholeType || 'Wormhole',
          sigFrom: sigFrom ? sigFrom.trim().toUpperCase() : undefined,
          massStatus: 'stable',
          timeStatus: 'stable'
        });
      } else if (sigFrom) {
        exists.sigFrom = sigFrom.trim().toUpperCase();
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

  public addSystemConnection = this.addWormholeConnection.bind(this);

  // Update connection signature, WH type, mass status, and time status
  public async updateConnection(data: {
    connectionId?: string;
    from: string;
    to: string;
    sigFrom?: string;
    sigTo?: string;
    wormholeType?: string;
    massStatus?: 'stable' | 'destab' | 'critical';
    timeStatus?: 'stable' | 'eol';
    tactical?: 'clear' | 'bubbled' | 'camped';
    isFrig?: boolean;
  }) {
    let conn = this.state.connections.find(c => 
      (data.connectionId && c.id === data.connectionId) ||
      (c.from === data.from && c.to === data.to) ||
      (c.from === data.to && c.to === data.from)
    );

    if (!conn) {
      conn = {
        id: data.connectionId || `conn-${Date.now()}`,
        from: data.from,
        to: data.to,
        wormholeType: data.wormholeType || 'Wormhole',
        massStatus: data.massStatus || 'stable',
        timeStatus: data.timeStatus || 'stable',
        tactical: data.tactical || 'clear',
        isFrig: data.isFrig || false
      };
      this.state.connections.push(conn);
    }

    if (data.sigFrom !== undefined) conn.sigFrom = data.sigFrom.trim().toUpperCase();
    if (data.sigTo !== undefined) conn.sigTo = data.sigTo.trim().toUpperCase();
    if (data.wormholeType !== undefined) conn.wormholeType = data.wormholeType.trim();
    if (data.massStatus !== undefined) conn.massStatus = data.massStatus;
    if (data.timeStatus !== undefined) conn.timeStatus = data.timeStatus;
    if (data.tactical !== undefined) conn.tactical = data.tactical;
    if (data.isFrig !== undefined) conn.isFrig = data.isFrig;

    if (data.to && this.state.systems[data.to] && data.sigFrom) {
      this.state.systems[data.to].sigCode = data.sigFrom.trim().toUpperCase();
    }

    this.notify();

    try {
      await fetch('/api/map/connection/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn("Failed to update connection:", e);
    }
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

  // Sync scanned signatures & anomalies to a system
  public async syncSystemSignatures(systemId: string, signatures: WormholeSignature[]) {
    if (!systemId) return;
    const cleanSys = systemId.trim();
    if (!this.state.systems[cleanSys]) {
      this.state.systems[cleanSys] = {
        id: cleanSys,
        name: cleanSys,
        systemClass: cleanSys.startsWith('J') ? 'C3' : 'Highsec',
        statics: [],
        structures: [],
        activePilots: [],
        signatures: [],
        lastUpdated: getEveTime()
      };
    }

    this.state.systems[cleanSys].signatures = signatures;
    this.state.systems[cleanSys].lastUpdated = getEveTime();
    this.notify();

    try {
      await fetch('/api/map/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemId: cleanSys, signatures })
      });
    } catch {}
  }

  // Toggle fold / collapse for a subchain node
  public async toggleSystemCollapse(systemId: string) {
    if (this.state.systems[systemId]) {
      this.state.systems[systemId].isCollapsed = !this.state.systems[systemId].isCollapsed;
      this.notify();

      try {
        await fetch('/api/map/system/collapse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemId })
        });
      } catch {}
    }
  }

  // Delete a system and all its connections
  public async deleteSystem(systemId: string) {
    if (!systemId) return;
    const cleanSys = systemId.trim();

    delete this.state.systems[cleanSys];
    this.state.connections = this.state.connections.filter(
      c => c.from !== cleanSys && c.to !== cleanSys
    );
    this.notify();

    try {
      await fetch('/api/map/system/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemId: cleanSys })
      });
    } catch {}
  }

  // Prune disconnected / dead-end systems
  public async pruneDeadEnds() {
    try {
      await fetch('/api/map/prune', { method: 'POST' });
    } catch {}
  }

  // GalaxyFinder Tidy Tree Auto-Organizer
  public autoOrganizeTreeLayout() {
    const systems = this.state.systems;
    const connections = this.state.connections;
    const sysKeys = Object.keys(systems);
    if (sysKeys.length === 0) return;

    // Root is 'Jita' or first system
    const rootId = systems['Jita'] ? 'Jita' : sysKeys[0];
    const visited = new Set<string>();
    const levels: string[][] = [];

    // BFS tree traversal
    let currentLevel = [rootId];
    visited.add(rootId);

    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      const nextLevel: string[] = [];

      for (const parentId of currentLevel) {
        const children = connections
          .filter(c => c.from === parentId && !visited.has(c.to))
          .map(c => c.to);

        for (const childId of children) {
          if (!visited.has(childId)) {
            visited.add(childId);
            nextLevel.push(childId);
          }
        }
      }

      currentLevel = nextLevel;
    }

    // Add unvisited systems
    const remaining = sysKeys.filter(k => !visited.has(k));
    if (remaining.length > 0) {
      levels.push(remaining);
    }

    // Assign X, Y coordinates
    const NODE_WIDTH = 138;
    const HORIZONTAL_GAP = 28;
    const VERTICAL_GAP = 98;
    const ROOT_CENTER_X = 650;
    const START_Y = 40;

    levels.forEach((levelNodes, depth) => {
      const totalWidth = levelNodes.length * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
      const startX = ROOT_CENTER_X - totalWidth / 2;
      const y = START_Y + depth * VERTICAL_GAP;

      levelNodes.forEach((nodeId, idx) => {
        if (systems[nodeId]) {
          systems[nodeId].x = Math.round(startX + idx * (NODE_WIDTH + HORIZONTAL_GAP));
          systems[nodeId].y = y;
        }
      });
    });

    this.notify();

    fetch('/api/map/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainMap: this.state })
    }).catch(() => {});
  }

  // Toggle collapse on all subchains
  public toggleCollapseAll(collapse?: boolean) {
    const shouldCollapse = collapse !== undefined ? collapse : !Object.values(this.state.systems).some(s => s.isCollapsed);
    Object.values(this.state.systems).forEach(s => {
      s.isCollapsed = shouldCollapse;
    });
    this.notify();
  }

  // Structure Timer Management
  public addStructureTimer(timer: StructureTimer) {
    if (!this.state.timers) this.state.timers = [];
    this.state.timers = [timer, ...this.state.timers.filter(t => t.id !== timer.id)];
    this.notify();

    fetch('/api/map/timer/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timer)
    }).catch(() => {});
  }

  public deleteStructureTimer(timerId: string) {
    if (!this.state.timers) return;
    this.state.timers = this.state.timers.filter(t => t.id !== timerId);
    this.notify();

    fetch('/api/map/timer/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timerId })
    }).catch(() => {});
  }

  public getTimers(): StructureTimer[] {
    return this.state.timers || [];
  }

  public getSystemTimers(systemName: string): StructureTimer[] {
    const clean = systemName.trim().toUpperCase();
    return (this.state.timers || []).filter(t => t.systemName.trim().toUpperCase() === clean);
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
          lastUpdated: getEveTime()
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
