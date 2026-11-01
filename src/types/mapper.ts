export interface ScannedStructure {
  id: string;
  name: string;
  type: string;
  distance: string;
  scoutedBy: string;
  timestamp: string;
}

export interface WormholeSignature {
  id?: string;
  sigId: string; // e.g. "ABC-123" or "AUC-104"
  type: 'Wormhole' | 'Relic' | 'Data' | 'Combat' | 'Gas' | 'Ore' | 'Anomaly' | 'Unknown';
  name?: string;
  group?: string;
  leadsTo?: string; // e.g. "J115405"
  whType?: string; // e.g. "K162", "H296"
  signalPercent?: number;
  distance?: string;
  createdTime?: string;
}

export interface WormholeNode {
  id: string; // system name, e.g. "J152438" or "Jita"
  name: string;
  systemClass: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'Highsec' | 'Lowsec' | 'Nullsec' | 'Thera' | 'Pochven';
  security?: number;
  sigCode?: string;
  effect?: string;
  statics: string[];
  structures: ScannedStructure[];
  activePilots: string[];
  signatures: WormholeSignature[];
  isCollapsed?: boolean;
  notes?: string;
  lastUpdated: string;
  x?: number;
  y?: number;
}

export interface WormholeConnection {
  id: string;
  from: string;
  to: string;
  wormholeType?: string; // e.g. "H296", "K162"
  sigFrom?: string;
  sigTo?: string;
  massStatus?: 'stable' | 'destab' | 'critical';
  timeStatus?: 'stable' | 'eol'; // end of life
  tactical?: 'clear' | 'bubbled' | 'camped';
  isFrig?: boolean;
}

export interface ChainMapState {
  systems: Record<string, WormholeNode>;
  connections: WormholeConnection[];
  onlineBuddies: string[];
}
