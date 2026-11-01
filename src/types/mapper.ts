export interface ScannedStructure {
  id: string;
  name: string;
  type: string;
  distance: string;
  scoutedBy: string;
  timestamp: string;
}

export interface WormholeSignature {
  sigId: string; // e.g. "ABC-123"
  type: 'Wormhole' | 'Relic' | 'Data' | 'Combat' | 'Gas' | 'Unknown';
  name?: string;
  leadsTo?: string; // e.g. "J115405"
}

export interface WormholeNode {
  id: string; // system name, e.g. "J152438" or "Jita"
  name: string;
  systemClass: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'Highsec' | 'Lowsec' | 'Nullsec' | 'Thera' | 'Pochven';
  effect?: string;
  statics: string[];
  structures: ScannedStructure[];
  activePilots: string[];
  signatures: WormholeSignature[];
  notes?: string;
  lastUpdated: string;
}

export interface WormholeConnection {
  id: string;
  from: string;
  to: string;
  wormholeType?: string; // e.g. "H296", "K162"
  massStatus?: 'stable' | 'destab' | 'critical';
  timeStatus?: 'stable' | 'eol'; // end of life
}

export interface ChainMapState {
  systems: Record<string, WormholeNode>;
  connections: WormholeConnection[];
  onlineBuddies: string[];
}
