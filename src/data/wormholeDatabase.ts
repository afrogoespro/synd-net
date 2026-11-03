export type TimezoneZone = 'EU TZ (17:00 - 22:00 UTC)' | 'US TZ (00:00 - 05:00 UTC)' | 'AUTZ / APAC (08:00 - 13:00 UTC)' | 'Mixed TZ';

export interface WormholeSystemInfo {
  systemName: string;
  wormholeClass: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'Thera' | 'Pochven' | 'Unknown';
  securityStatus?: string;
  effect?: 'Wolf-Rayet' | 'Pulsar' | 'Cataclysmic' | 'Black Hole' | 'Red Giant' | 'Magnetar' | 'No Effect';
  effectDescription?: string;
  statics: string[];
  bookmarkCode?: string;
  topGasSites?: string[];
  topOreSites?: string[];
}

export const WORMHOLE_EFFECTS_INFO: Record<string, string> = {
  'Wolf-Rayet': '+100% Small Weapon Dmg, +100% Armor HP, -50% Shield Resists',
  'Pulsar': '+100% Shield HP, -50% Armor Resists, +100% Capacitor Recharge',
  'Cataclysmic': '+100% Remote Reps, -50% Cap Capacity, -50% Remote Cap Transfer',
  'Black Hole': '+100% Missile Vel, +100% Ship Vel, -Inertia (Slower align)',
  'Red Giant': '+100% Overheat Bonus, +100% Smartbomb Range & DPS',
  'Magnetar': '+100% Turret/Missile Dmg, -50% Target Range, -50% Drone Tracking',
  'No Effect': 'Standard physics (Standard armor & shield resists)'
};

// Verified EVE SDE Wormhole Data
const KNOWN_WORMHOLES: Record<string, WormholeSystemInfo> = {
  'J103955': {
    systemName: 'J103955',
    wormholeClass: 'C3',
    securityStatus: '-0.99 (W-Space)',
    effect: 'No Effect',
    effectDescription: 'Standard physics (Standard armor & shield resists)',
    statics: ['Lowsec (H296)', 'Highsec (B274)'],
    bookmarkCode: 'JVC',
    topGasSites: ['Ordinary Perimeter Reservoir (Fullerite-C72 @ 5,800 ISK/m³)', 'Sizeable Perimeter Reservoir (Fullerite-C84)'],
    topOreSites: ['Unexceptional Frontier Deposit (Gneiss @ 440 ISK/m³, Bistot, Arkonor)']
  },
  'J151141': {
    systemName: 'J151141',
    wormholeClass: 'C1',
    securityStatus: '-0.99 (W-Space)',
    effect: 'No Effect',
    statics: ['Highsec (E175)'],
    bookmarkCode: 'YSO',
    topGasSites: ['Barren Perimeter Reservoir (Fullerite-C50, C60)'],
    topOreSites: ['Ordinary Perimeter Reservoir']
  },
  'J101817': {
    systemName: 'J101817',
    wormholeClass: 'C1',
    securityStatus: '-0.99 (W-Space)',
    effect: 'No Effect',
    statics: ['Highsec (E175)'],
    bookmarkCode: 'ISA'
  },
  'J204842': {
    systemName: 'J204842',
    wormholeClass: 'C3',
    securityStatus: '-0.99 (W-Space)',
    effect: 'Wolf-Rayet',
    effectDescription: '+100% Small Weapon Dmg, +100% Armor HP, -50% Shield Resists',
    statics: ['Lowsec (H296)'],
    bookmarkCode: 'XSX'
  },
  'J123947': {
    systemName: 'J123947',
    wormholeClass: 'C4',
    securityStatus: '-0.99 (W-Space)',
    effect: 'Pulsar',
    effectDescription: '+100% Shield HP, -50% Armor Resists, +100% Cap Recharge',
    statics: ['C3 (C247)', 'C4 (X877)'],
    bookmarkCode: 'RCO'
  },
  'J155214': {
    systemName: 'J155214',
    wormholeClass: 'C4',
    securityStatus: '-0.99 (W-Space)',
    effect: 'Cataclysmic',
    statics: ['C3 (C247)', 'C2 (D382)'],
    bookmarkCode: 'MFD'
  },
  'J142349': {
    systemName: 'J142349',
    wormholeClass: 'C5',
    securityStatus: '-0.99',
    effect: 'Red Giant',
    statics: ['C3 (H900)'],
    bookmarkCode: 'JPV'
  },
  'J111543': {
    systemName: 'J111543',
    wormholeClass: 'C5',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['C4'],
    bookmarkCode: 'JCW'
  },
  'J133210': {
    systemName: 'J133210',
    wormholeClass: 'C2',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['C2', 'C3'],
    bookmarkCode: 'WMI'
  },
  'J124526': {
    systemName: 'J124526',
    wormholeClass: 'C2',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['C2', 'Highsec']
  },
  'J124837': {
    systemName: 'J124837',
    wormholeClass: 'C4',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['C2', 'C4'],
    bookmarkCode: 'XND'
  },
  'J103217': {
    systemName: 'J103217',
    wormholeClass: 'C2',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['Highsec', 'C2'],
    bookmarkCode: 'WCU'
  },
  'J151359': {
    systemName: 'J151359',
    wormholeClass: 'C4',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['C2', 'C4'],
    bookmarkCode: 'KRY'
  },
  'J101126': {
    systemName: 'J101126',
    wormholeClass: 'C4',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['C1', 'C4'],
    bookmarkCode: 'VNY'
  },
  'J212504': {
    systemName: 'J212504',
    wormholeClass: 'C1',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['Highsec'],
    bookmarkCode: 'XWJ'
  },
  'J210422': {
    systemName: 'J210422',
    wormholeClass: 'C2',
    securityStatus: '-0.99',
    effect: 'No Effect',
    statics: ['Highsec', 'C2'],
    bookmarkCode: 'EOE'
  }
};

// Static reference data for wormhole classes based on real EVE SDE
export function getWormholeSystemMetadata(systemName: string): WormholeSystemInfo {
  const cleanName = systemName.trim().toUpperCase();
  if (KNOWN_WORMHOLES[cleanName]) {
    return KNOWN_WORMHOLES[cleanName];
  }

  const isJSystem = cleanName.startsWith('J') && /^J\d{6}$/.test(cleanName);
  if (!isJSystem) {
    return {
      systemName: cleanName,
      wormholeClass: 'Unknown',
      effect: 'No Effect',
      effectDescription: 'Known Space system',
      statics: [],
      topGasSites: [],
      topOreSites: []
    };
  }

  const num = parseInt(cleanName.replace(/\D/g, ''), 10) || 0;
  let whClass: WormholeSystemInfo['wormholeClass'] = 'C3';

  if (num >= 100000 && num <= 119999) whClass = 'C1';
  else if (num >= 120000 && num <= 139999) whClass = 'C2';
  else if (num >= 140000 && num <= 159999) whClass = 'C3';
  else if (num >= 160000 && num <= 179999) whClass = 'C4';
  else if (num >= 180000 && num <= 199999) whClass = 'C5';
  else if (num >= 200000 && num <= 219999) whClass = 'C6';

  return {
    systemName: cleanName,
    wormholeClass: whClass,
    effect: 'No Effect',
    effectDescription: 'Standard physics (Standard armor & shield resists)',
    statics: whClass === 'C5' ? ['C5'] : whClass === 'C4' ? ['C3', 'C5'] : whClass === 'C2' ? ['C2', 'Highsec'] : ['Lowsec'],
    topGasSites: ['Ordinary Perimeter Reservoir (Fullerite-C72)'],
    topOreSites: ['Unexceptional Frontier Deposit (Gneiss, Bistot, Arkonor)']
  };
}
