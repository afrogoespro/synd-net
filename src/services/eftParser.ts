export interface ParsedFit {
  shipName: string;
  fitName: string;
  lowSlots: string[];
  medSlots: string[];
  highSlots: string[];
  rigs: string[];
  subsystems: string[];
  drones: { name: string; count: number }[];
  cargo: { name: string; count: number }[];
  rawText: string;
}

export function parseEFTFit(rawText: string): ParsedFit | null {
  const lines = rawText.split(/\r?\n/).map(l => l.trim());
  if (lines.length === 0) return null;

  // First line should match [Ship Name, Fit Name]
  const headerMatch = lines[0].match(/^\[(.*?),\s*(.*?)\]$/);
  if (!headerMatch) return null;

  const shipName = headerMatch[1].trim();
  const fitName = headerMatch[2].trim();

  // Group sections separated by blank lines
  const sections: string[][] = [];
  let currentSection: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') {
      if (currentSection.length > 0) {
        sections.push(currentSection);
        currentSection = [];
      }
    } else {
      currentSection.push(line);
    }
  }
  if (currentSection.length > 0) {
    sections.push(currentSection);
  }

  const lowSlots: string[] = [];
  const medSlots: string[] = [];
  const highSlots: string[] = [];
  const rigs: string[] = [];
  const subsystems: string[] = [];
  const drones: { name: string; count: number }[] = [];
  const cargo: { name: string; count: number }[] = [];

  // EFT standard order usually:
  // Section 0: Low slots
  // Section 1: Mid slots
  // Section 2: High slots
  // Section 3: Rigs
  // Section 4: Subsystems (if T3C) or Drones/Cargo
  sections.forEach((sec, idx) => {
    sec.forEach(item => {
      // Check for quantity multiplier e.g. "Warrior II x5"
      const qtyMatch = item.match(/^(.*?)\s*x(\d+)$/i);
      const name = qtyMatch ? qtyMatch[1].trim() : item.split(',')[0].trim();
      const count = qtyMatch ? parseInt(qtyMatch[2], 10) : 1;

      if (idx === 0) lowSlots.push(name);
      else if (idx === 1) medSlots.push(name);
      else if (idx === 2) highSlots.push(name);
      else if (idx === 3) rigs.push(name);
      else {
        if (name.includes('Subsystem')) {
          subsystems.push(name);
        } else if (name.toLowerCase().includes('drone') || name.includes('Warrior') || name.includes('Hornet') || name.includes('Hammerhead') || name.includes('Valkyrie') || name.includes('Ogre')) {
          drones.push({ name, count });
        } else {
          cargo.push({ name, count });
        }
      }
    });
  });

  return {
    shipName,
    fitName,
    lowSlots,
    medSlots,
    highSlots,
    rigs,
    subsystems,
    drones,
    cargo,
    rawText
  };
}
