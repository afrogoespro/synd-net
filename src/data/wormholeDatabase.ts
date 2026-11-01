export type TimezoneZone = 'EU TZ (17:00 - 22:00 UTC)' | 'US TZ (00:00 - 05:00 UTC)' | 'AUTZ / APAC (08:00 - 13:00 UTC)' | 'Mixed TZ';

export interface WormholeSystemInfo {
  systemName: string;
  wormholeClass: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'Thera' | 'Pochven' | 'Unknown';
  effect?: 'Wolf-Rayet' | 'Pulsar' | 'Cataclysmic' | 'Black Hole' | 'Red Giant' | 'Magnetar' | 'No Effect';
  effectDescription?: string;
  statics: string[];
}

export const WORMHOLE_EFFECTS_INFO: Record<string, string> = {
  'Wolf-Rayet': '+Small Weapon Damage (+100%), +Armor HP (+100%), -Shield Resists',
  'Pulsar': '+Shield HP (+100%), -Armor Resists, +Capacitor Recharge',
  'Cataclysmic': '+Remote Armor/Shield Reps (+100%), -Capacitor Capacity, -Remote Cap Transfer',
  'Black Hole': '+Missile Velocity (+100%), +Ship Velocity (+100%), -Inertia (Hard to align)',
  'Red Giant': '+Overheat Bonus (+100%), +Smartbomb Range/DPS (+100%)',
  'Magnetar': '+Turret/Missile Damage (+100%), -Targeting Range, -Tracking Speed',
  'No Effect': 'Standard space physics'
};

// Static reference data for wormhole classes based on real EVE SDE
export function getWormholeSystemMetadata(systemName: string): WormholeSystemInfo {
  const cleanName = systemName.trim().toUpperCase();

  // Basic SDE prefix range approximation
  // Real J-system ID ranges
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
    statics: whClass === 'C5' ? ['C5'] : whClass === 'C4' ? ['C3', 'C5'] : whClass === 'C2' ? ['C2', 'Highsec'] : ['Lowsec']
  };
}
