export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'neutral' | 'structure';

export type ShipRole =
  | 'Titan'
  | 'Supercarrier'
  | 'Dreadnought'
  | 'Force Auxiliary (FAX)'
  | 'Carrier'
  | 'Black Ops'
  | 'Marauder'
  | 'Battleship'
  | 'Strategic Cruiser (T3C)'
  | 'Combat Recon'
  | 'Force Recon'
  | 'Heavy Assault Cruiser (HAC)'
  | 'Logistics Cruiser'
  | 'Command Ship'
  | 'Heavy Interdictor (HIC)'
  | 'Battlecruiser'
  | 'Cruiser'
  | 'Interdictor (Dictor)'
  | 'Command Destroyer'
  | 'Tactical Destroyer (T3D)'
  | 'Stealth Bomber'
  | 'Covert Ops'
  | 'Interceptor'
  | 'Electronic Attack Frigate'
  | 'Assault Frigate'
  | 'Frigate'
  | 'Destroyer'
  | 'Mining Barge / Exhumer'
  | 'Industrial / Hauler'
  | 'Freighter / Jump Freighter'
  | 'Interdiction Bubble'
  | 'Citadel / Upwell'
  | 'Wormhole'
  | 'Deployable / Sentry'
  | 'Drone / Fighter'
  | 'Wreck / Container'
  | 'Unknown';

export interface ShipInfo {
  name: string;
  typeId?: number;
  role: ShipRole;
  group: string;
  threatLevel: ThreatLevel;
  threatReason?: string;
  isCynoCapable?: boolean;
  isBubbler?: boolean;
  isCombatRecon?: boolean;
  wormholeCode?: string;
}

export interface DScanItem {
  id: string;
  rawLine: string;
  itemName: string;
  itemType: string;
  distanceStr: string;
  distanceMeters: number;
  distanceAU: number;
  shipInfo: ShipInfo;
}

export interface DScanGroupSummary {
  role: ShipRole;
  group: string;
  threatLevel: ThreatLevel;
  count: number;
  items: DScanItem[];
}

export interface DScanReport {
  timestamp: Date;
  rawInput: string;
  totalItems: number;
  uniqueShipsCount: number;
  maxThreat: ThreatLevel;
  items: DScanItem[];
  groupedByRole: Record<string, DScanGroupSummary>;
  criticalThreats: DScanItem[];
  tacklers: DScanItem[];
  bubbles: DScanItem[];
  capitals: DScanItem[];
  recons: DScanItem[];
  wormholes: DScanItem[];
}
