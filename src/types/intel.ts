export interface PilotIntel {
  name: string;
  characterId?: number;
  corporationName?: string;
  corporationId?: number;
  allianceName?: string;
  allianceId?: number;
  securityStatus?: number;
  dangerRating?: number; // 0 - 100%
  kills?: number;
  losses?: number;
  soloKills?: number;
  gangRatio?: number;
  topShips?: string[];
  isCynoPilot?: boolean;
  isHighThreat?: boolean;
  notes?: string;
  status: 'loading' | 'success' | 'not_found' | 'error';
}

export interface LocalIntelReport {
  timestamp: Date;
  pilots: PilotIntel[];
  totalPilots: number;
  hostileCount: number;
  cynoThreatCount: number;
  alliances: { name: string; count: number }[];
  corporations: { name: string; count: number }[];
}
