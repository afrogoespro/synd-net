export interface KillmailItem {
  killmailId: number;
  killmailTime: string;
  solarSystemName: string;
  solarSystemSecurity: number;
  regionName: string;
  totalValue: number; // ISK
  victim: {
    characterName: string;
    corporationName: string;
    allianceName?: string;
    shipTypeName: string;
    shipTypeId: number;
    damageTaken: number;
  };
  attackerCount: number;
  finalBlow: {
    characterName: string;
    corporationName: string;
    allianceName?: string;
    shipTypeName: string;
    shipTypeId: number;
  };
  isSolo: boolean;
  isCapital: boolean;
  zkillUrl: string;
}
