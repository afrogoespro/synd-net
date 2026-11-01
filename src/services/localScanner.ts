import { PilotIntel, LocalIntelReport } from '../types/intel';
import { fetchLivePilotIntelligence } from './zkillService';

export function parseLocalPilots(rawText: string): string[] {
  const lines = rawText.split(/\r?\n/);
  const pilots: string[] = [];

  for (const line of lines) {
    let clean = line.trim();
    if (!clean) continue;

    // Ignore system logs e.g. "[ 2026.11.01 10:20:00 ] EVE System > Channel changed..."
    if (clean.includes('EVE System') || clean.includes('Channel changed') || clean.includes('Channel MOTD')) {
      continue;
    }

    // Strip timestamp prefix if pasted with chat logs: e.g. "[ 14:22:01 ] Pilot Name > Hello"
    const chatMsgMatch = clean.match(/^\[.*?\]\s*([^>]+)>/);
    if (chatMsgMatch) {
      clean = chatMsgMatch[1].trim();
    } else {
      // Strip leading timestamps like "[ 14:22 ] Pilot Name"
      clean = clean.replace(/^\[.*?\]\s*/, '').trim();
    }

    if (clean && !pilots.includes(clean)) {
      pilots.push(clean);
    }
  }

  return pilots;
}

// Fetches 100% LIVE intelligence for pilots from CCP ESI and zKillboard APIs
export async function analyzeLocalPilots(pilotNames: string[]): Promise<LocalIntelReport> {
  if (pilotNames.length === 0) {
    return {
      timestamp: new Date(),
      pilots: [],
      totalPilots: 0,
      hostileCount: 0,
      cynoThreatCount: 0,
      alliances: [],
      corporations: []
    };
  }

  // Live ESI + zKillboard lookup
  const pilots: PilotIntel[] = await fetchLivePilotIntelligence(pilotNames);

  // Sort by highest danger rating first
  pilots.sort((a, b) => (b.dangerRating || 0) - (a.dangerRating || 0));

  // Compute stats
  const allianceMap: Record<string, number> = {};
  const corpMap: Record<string, number> = {};

  for (const p of pilots) {
    if (p.allianceName) {
      allianceMap[p.allianceName] = (allianceMap[p.allianceName] || 0) + 1;
    }
    if (p.corporationName) {
      corpMap[p.corporationName] = (corpMap[p.corporationName] || 0) + 1;
    }
  }

  const alliances = Object.entries(allianceMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const corporations = Object.entries(corpMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    timestamp: new Date(),
    pilots,
    totalPilots: pilots.length,
    hostileCount: pilots.filter(p => p.isHighThreat).length,
    cynoThreatCount: pilots.filter(p => p.isCynoPilot).length,
    alliances,
    corporations
  };
}
