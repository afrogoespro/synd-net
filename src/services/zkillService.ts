import { PilotIntel } from '../types/intel';
import { KillmailItem } from '../types/killmail';

// In-memory cache to respect zKill and ESI rate limits
const pilotCache = new Map<string, PilotIntel>();
const nameCache = new Map<number, string>();

// ESI API Base
const ESI_BASE = 'https://esi.evetech.net/latest';

// Fetch ID mappings for an array of character names
export async function lookupCharacterIds(names: string[]): Promise<Record<string, number>> {
  if (names.length === 0) return {};

  try {
    const res = await fetch(`${ESI_BASE}/universe/ids/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(names)
    });

    if (!res.ok) return {};
    const data = await res.json();
    const result: Record<string, number> = {};

    if (data.characters) {
      data.characters.forEach((c: { id: number; name: string }) => {
        result[c.name.toLowerCase()] = c.id;
      });
    }

    return result;
  } catch (err) {
    console.error("ESI universe/ids error:", err);
    return {};
  }
}

// Fetch entity names (Corps, Alliances, Solar Systems, Ship Types)
export async function lookupEntityNames(ids: number[]): Promise<Record<number, string>> {
  const missing = ids.filter(id => id && !nameCache.has(id));
  if (missing.length === 0) {
    const result: Record<number, string> = {};
    ids.forEach(id => {
      if (nameCache.has(id)) result[id] = nameCache.get(id)!;
    });
    return result;
  }

  try {
    const res = await fetch(`${ESI_BASE}/universe/names/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missing)
    });

    if (res.ok) {
      const data = await res.json();
      data.forEach((item: { id: number; name: string }) => {
        nameCache.set(item.id, item.name);
      });
    }
  } catch (e) {
    console.warn("ESI universe/names lookup error", e);
  }

  const result: Record<number, string> = {};
  ids.forEach(id => {
    result[id] = nameCache.get(id) || `ID:${id}`;
  });
  return result;
}

// Fetch live zKillboard statistics for a character
export async function fetchLiveZkillStats(characterId: number): Promise<{
  dangerRatio?: number;
  gangRatio?: number;
  shipsDestroyed?: number;
  shipsLost?: number;
  soloKills?: number;
  isCynoPilot?: boolean;
  topShips?: string[];
} | null> {
  try {
    // Try via Vite proxy first, fallback to direct
    let res = await fetch(`/api/zkill/stats/characterID/${characterId}/`);
    if (!res.ok) {
      res = await fetch(`https://zkillboard.com/api/stats/characterID/${characterId}/`, {
        headers: { 'Accept': 'application/json' }
      });
    }

    if (!res.ok) return null;
    const stats = await res.json();

    const topShips: string[] = [];
    if (stats.topLists && Array.isArray(stats.topLists)) {
      const shipsList = stats.topLists.find((l: any) => l.type === 'shipType');
      if (shipsList?.values) {
        shipsList.values.slice(0, 4).forEach((v: any) => {
          if (v.shipName) topShips.push(v.shipName);
        });
      }
    }

    return {
      dangerRatio: stats.dangerRatio ?? 0,
      gangRatio: stats.gangRatio ?? 50,
      shipsDestroyed: stats.shipsDestroyed ?? 0,
      shipsLost: stats.shipsLost ?? 0,
      soloKills: stats.soloKills ?? 0,
      isCynoPilot: Boolean(stats.cyno && stats.cyno > 0),
      topShips: topShips.length > 0 ? topShips : undefined
    };
  } catch (e) {
    console.warn(`zKill stats lookup failed for ${characterId}`, e);
    return null;
  }
}

// Fetch character profile from ESI (sec status, corp ID, alliance ID)
export async function fetchCharacterPublicInfo(characterId: number): Promise<{
  securityStatus: number;
  corporationId: number;
  allianceId?: number;
} | null> {
  try {
    const res = await fetch(`${ESI_BASE}/characters/${characterId}/`);
    if (!res.ok) return null;
    const data = await res.json();

    return {
      securityStatus: Number((data.security_status || 0).toFixed(1)),
      corporationId: data.corporation_id,
      allianceId: data.alliance_id
    };
  } catch {
    return null;
  }
}

// Fetch complete live intelligence for an array of pilot names
export async function fetchLivePilotIntelligence(pilotNames: string[]): Promise<PilotIntel[]> {
  const uncached = pilotNames.filter(name => !pilotCache.has(name.toLowerCase()));

  if (uncached.length > 0) {
    // 1. Resolve character IDs via ESI
    const nameToId = await lookupCharacterIds(uncached);

    // 2. Fetch Character public info & zKill stats in parallel
    const entityIdsToResolve = new Set<number>();

    const promises = uncached.map(async (name) => {
      const charId = nameToId[name.toLowerCase()];
      if (!charId) {
        return {
          name,
          dangerRating: 0,
          status: 'not_found' as const
        };
      }

      const [publicInfo, zkill] = await Promise.all([
        fetchCharacterPublicInfo(charId),
        fetchLiveZkillStats(charId)
      ]);

      if (publicInfo?.corporationId) entityIdsToResolve.add(publicInfo.corporationId);
      if (publicInfo?.allianceId) entityIdsToResolve.add(publicInfo.allianceId);

      const danger = zkill?.dangerRatio ?? 20;
      const isHighThreat = danger > 75;

      const pilot: PilotIntel = {
        name,
        characterId: charId,
        corporationId: publicInfo?.corporationId,
        allianceId: publicInfo?.allianceId,
        securityStatus: publicInfo?.securityStatus ?? 0,
        dangerRating: danger,
        kills: zkill?.shipsDestroyed ?? 0,
        losses: zkill?.shipsLost ?? 0,
        soloKills: zkill?.soloKills ?? 0,
        gangRatio: zkill?.gangRatio ?? 50,
        topShips: zkill?.topShips,
        isCynoPilot: zkill?.isCynoPilot || danger > 85,
        isHighThreat,
        status: 'success'
      };

      pilotCache.set(name.toLowerCase(), pilot);
      return pilot;
    });

    await Promise.all(promises);

    // 3. Resolve Corp and Alliance Names
    if (entityIdsToResolve.size > 0) {
      const namesMap = await lookupEntityNames(Array.from(entityIdsToResolve));
      for (const name of uncached) {
        const cached = pilotCache.get(name.toLowerCase());
        if (cached) {
          if (cached.corporationId && namesMap[cached.corporationId]) {
            cached.corporationName = namesMap[cached.corporationId];
          }
          if (cached.allianceId && namesMap[cached.allianceId]) {
            cached.allianceName = namesMap[cached.allianceId];
          }
        }
      }
    }
  }

  return pilotNames.map(name => {
    return pilotCache.get(name.toLowerCase()) || {
      name,
      dangerRating: 15,
      status: 'not_found'
    };
  });
}

// Fetch real recent kills from zKillboard
export async function fetchLiveRecentKills(limit: number = 15): Promise<KillmailItem[]> {
  try {
    let res = await fetch(`/api/zkill/kills/`);
    if (!res.ok) {
      res = await fetch('https://zkillboard.com/api/kills/', {
        headers: { 'Accept': 'application/json' }
      });
    }

    if (!res.ok) return [];
    const killsRaw = await res.json();
    if (!Array.isArray(killsRaw)) return [];

    // Collect IDs for bulk name lookup
    const idsToResolve = new Set<number>();
    killsRaw.slice(0, limit).forEach(k => {
      if (k.solar_system_id) idsToResolve.add(k.solar_system_id);
      if (k.victim?.ship_type_id) idsToResolve.add(k.victim.ship_type_id);
      if (k.victim?.character_id) idsToResolve.add(k.victim.character_id);
      if (k.victim?.corporation_id) idsToResolve.add(k.victim.corporation_id);
      if (k.victim?.alliance_id) idsToResolve.add(k.victim.alliance_id);

      const finalBlow = k.attackers?.find((a: any) => a.final_blow);
      if (finalBlow) {
        if (finalBlow.character_id) idsToResolve.add(finalBlow.character_id);
        if (finalBlow.corporation_id) idsToResolve.add(finalBlow.corporation_id);
        if (finalBlow.alliance_id) idsToResolve.add(finalBlow.alliance_id);
        if (finalBlow.ship_type_id) idsToResolve.add(finalBlow.ship_type_id);
      }
    });

    const nameMap = await lookupEntityNames(Array.from(idsToResolve));

    return killsRaw.slice(0, limit).map((k: any): KillmailItem => {
      const finalBlow = k.attackers?.find((a: any) => a.final_blow) || k.attackers?.[0] || {};
      const victimShipName = nameMap[k.victim?.ship_type_id] || `Ship ${k.victim?.ship_type_id}`;
      const systemName = nameMap[k.solar_system_id] || `System ${k.solar_system_id}`;
      
      const isCapital = [
        'Avatar', 'Erebus', 'Ragnarok', 'Leviathan', 'Nyx', 'Aeon', 'Hel', 'Wyvern',
        'Revelation', 'Moros', 'Naglfar', 'Phoenix', 'Apostle', 'Ninazu', 'Lif', 'Minokawa', 'Dagon'
      ].some(cap => victimShipName.includes(cap));

      const timeStr = k.killmail_time ? new Date(k.killmail_time).toTimeString().slice(0, 8) : 'Just now';

      return {
        killmailId: k.killmail_id,
        killmailTime: timeStr,
        solarSystemName: systemName,
        solarSystemSecurity: finalBlow.security_status ? Number(finalBlow.security_status.toFixed(1)) : 0.0,
        regionName: systemName.startsWith('J') ? 'W-Space' : 'New Eden',
        totalValue: k.zkb?.totalValue || 0,
        victim: {
          characterName: nameMap[k.victim?.character_id] || (k.victim?.character_id ? `Pilot ${k.victim.character_id}` : 'Structure / NPC'),
          corporationName: nameMap[k.victim?.corporation_id] || 'Unknown Corp',
          allianceName: k.victim?.alliance_id ? nameMap[k.victim.alliance_id] : undefined,
          shipTypeName: victimShipName,
          shipTypeId: k.victim?.ship_type_id || 0,
          damageTaken: k.victim?.damage_taken || 0
        },
        attackerCount: k.attackers?.length || 1,
        finalBlow: {
          characterName: nameMap[finalBlow.character_id] || (finalBlow.character_id ? `Pilot ${finalBlow.character_id}` : 'NPC / Sentry'),
          corporationName: nameMap[finalBlow.corporation_id] || 'Unknown Corp',
          allianceName: finalBlow.alliance_id ? nameMap[finalBlow.alliance_id] : undefined,
          shipTypeName: nameMap[finalBlow.ship_type_id] || 'Unknown Ship',
          shipTypeId: finalBlow.ship_type_id || 0
        },
        isSolo: k.attackers?.length === 1,
        isCapital,
        zkillUrl: `https://zkillboard.com/kill/${k.killmail_id}/`
      };
    });
  } catch (err) {
    console.error("Live kills fetch error", err);
    return [];
  }
}
