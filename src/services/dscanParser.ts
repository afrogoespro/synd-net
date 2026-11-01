import { DScanItem, DScanReport, DScanGroupSummary, ThreatLevel } from '../types/dscan';
import { resolveShipInfo } from '../data/shipDatabase';

// Converts string distance to meters and AU
export function parseDistance(distStr: string): { meters: number; au: number; formatted: string } {
  if (!distStr || distStr.trim() === '-' || distStr.trim() === '') {
    return { meters: 0, au: 0, formatted: '0 km' };
  }

  const clean = distStr.trim().replace(/\u00A0/g, ' '); // remove non-breaking space
  const AU_IN_METERS = 149597870700;

  // AU match: e.g. "14.3 AU" or "14,3 AU"
  const auMatch = clean.match(/^([\d\.,]+)\s*AU$/i);
  if (auMatch) {
    const val = parseFloat(auMatch[1].replace(/,/g, '.'));
    const meters = val * AU_IN_METERS;
    return { meters, au: val, formatted: `${val.toFixed(2)} AU` };
  }

  // KM match: e.g. "2,450 km" or "150 km"
  const kmMatch = clean.match(/^([\d\.,\s]+)\s*km$/i);
  if (kmMatch) {
    const rawVal = kmMatch[1].replace(/\s/g, '').replace(/,/g, '');
    const val = parseFloat(rawVal);
    const meters = val * 1000;
    const au = meters / AU_IN_METERS;
    return { meters, au, formatted: `${val.toLocaleString()} km` };
  }

  // M match: e.g. "8,500 m" or "500 m"
  const mMatch = clean.match(/^([\d\.,\s]+)\s*m$/i);
  if (mMatch) {
    const rawVal = mMatch[1].replace(/\s/g, '').replace(/,/g, '');
    const meters = parseFloat(rawVal);
    const au = meters / AU_IN_METERS;
    return { meters, au, formatted: `${meters.toLocaleString()} m` };
  }

  return { meters: 0, au: 0, formatted: distStr };
}

// Parses raw clipboard text from EVE Online D-Scan window
export function parseDScan(rawText: string): DScanReport {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const items: DScanItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check tab delimited
    let parts = line.split('\t').map(p => p.trim());

    // If not tabs, check multiple spaces (e.g. copied from chat or web paste)
    if (parts.length < 3) {
      const spaceParts = line.split(/\s{2,}/).map(p => p.trim());
      if (spaceParts.length >= 2) {
        parts = spaceParts;
      }
    }

    if (parts.length >= 2) {
      let itemName = '';
      let itemType = '';
      let distanceStr = '-';

      if (parts.length >= 4 && !isNaN(Number(parts[0]))) {
        // Format: TypeID \t Item Name \t Item Type \t Distance
        itemName = parts[1];
        itemType = parts[2];
        distanceStr = parts[3];
      } else if (parts.length >= 3) {
        // Standard Format: Item Name \t Item Type \t Distance
        itemName = parts[0];
        itemType = parts[1];
        distanceStr = parts[2];
      } else {
        // 2 parts: Item Type \t Distance OR Item Name \t Item Type
        if (parts[1].toLowerCase().includes('au') || parts[1].toLowerCase().includes('km') || parts[1].toLowerCase().includes('m')) {
          itemType = parts[0];
          itemName = parts[0];
          distanceStr = parts[1];
        } else {
          itemName = parts[0];
          itemType = parts[1];
        }
      }

      const { meters, au, formatted } = parseDistance(distanceStr);
      const shipInfo = resolveShipInfo(itemType, itemName);

      items.push({
        id: `dscan-${i}-${Date.now()}`,
        rawLine: line,
        itemName,
        itemType,
        distanceStr: formatted,
        distanceMeters: meters,
        distanceAU: au,
        shipInfo
      });
    }
  }

  // Group by role
  const groupedByRole: Record<string, DScanGroupSummary> = {};
  for (const item of items) {
    const roleKey = item.shipInfo.role;
    if (!groupedByRole[roleKey]) {
      groupedByRole[roleKey] = {
        role: item.shipInfo.role,
        group: item.shipInfo.group,
        threatLevel: item.shipInfo.threatLevel,
        count: 0,
        items: []
      };
    }
    groupedByRole[roleKey].count += 1;
    groupedByRole[roleKey].items.push(item);
  }

  // Filter specific categories
  const criticalThreats = items.filter(
    item => item.shipInfo.threatLevel === 'critical' || item.shipInfo.threatLevel === 'high'
  );

  const tacklers = items.filter(
    item => item.shipInfo.role === 'Interceptor' ||
            item.shipInfo.role === 'Interdictor (Dictor)' ||
            item.shipInfo.role === 'Heavy Interdictor (HIC)'
  );

  const bubbles = items.filter(
    item => item.shipInfo.isBubbler || item.shipInfo.role === 'Interdiction Bubble'
  );

  const capitals = items.filter(
    item => item.shipInfo.group === 'Capital Ship' ||
            item.shipInfo.role === 'Titan' ||
            item.shipInfo.role === 'Supercarrier' ||
            item.shipInfo.role === 'Dreadnought' ||
            item.shipInfo.role === 'Carrier' ||
            item.shipInfo.role === 'Force Auxiliary (FAX)'
  );

  const recons = items.filter(
    item => item.shipInfo.role === 'Combat Recon' || item.shipInfo.role === 'Force Recon'
  );

  const wormholes = items.filter(
    item => item.shipInfo.role === 'Wormhole' || 
            item.itemType.toLowerCase().includes('wormhole') || 
            item.itemName.toLowerCase().includes('wormhole') ||
            item.itemName.toUpperCase().includes('K162') ||
            item.itemType.toUpperCase().includes('K162')
  );

  // Determine overall max threat
  let maxThreat: ThreatLevel = 'neutral';
  if (items.some(i => i.shipInfo.threatLevel === 'critical')) {
    maxThreat = 'critical';
  } else if (items.some(i => i.shipInfo.threatLevel === 'high')) {
    maxThreat = 'high';
  } else if (items.some(i => i.shipInfo.threatLevel === 'medium')) {
    maxThreat = 'medium';
  } else if (items.some(i => i.shipInfo.threatLevel === 'low')) {
    maxThreat = 'low';
  }

  return {
    timestamp: new Date(),
    rawInput: rawText,
    totalItems: items.length,
    uniqueShipsCount: new Set(items.map(i => i.itemType)).size,
    maxThreat,
    items,
    groupedByRole,
    criticalThreats,
    tacklers,
    bubbles,
    capitals,
    recons,
    wormholes
  };
}

// Generate formatted Discord markdown report
export function generateDiscordReport(report: DScanReport): string {
  const time = report.timestamp.toLocaleTimeString();
  let text = `📡 **[SYND.NET INTEL] D-Scan Report (${time})**\n`;
  text += `⚠️ **Threat Level:** ${report.maxThreat.toUpperCase()} | **Total On Scan:** ${report.totalItems}\n`;

  if (report.bubbles.length > 0) {
    text += `🚨 **BUBBLES / DICTORS:** ${report.bubbles.length} detected!\n`;
  }
  if (report.capitals.length > 0) {
    text += `💥 **CAPITALS DETECTED:** ${report.capitals.map(c => `${c.itemType} (${c.distanceStr})`).join(', ')}\n`;
  }
  if (report.recons.length > 0) {
    text += `👁️ **RECONS DETECTED:** ${report.recons.map(r => `${r.itemType} (${r.distanceStr})`).join(', ')}\n`;
  }

  text += `\n**Fleet Breakdown:**\n`;
  const sortedGroups = Object.values(report.groupedByRole).sort((a, b) => b.count - a.count);
  for (const g of sortedGroups) {
    text += `• **${g.role}** (${g.count}x): ${Array.from(new Set(g.items.map(i => i.itemType))).join(', ')}\n`;
  }

  text += `\n*Scanned via Synd.net Tactical Suite*`;
  return text;
}
