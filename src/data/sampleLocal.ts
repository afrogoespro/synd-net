export interface SampleLocalPreset {
  name: string;
  description: string;
  system: string;
  pilots: string;
  data?: string;
}

export const SAMPLE_LOCAL_PRESETS: SampleLocalPreset[] = [
  {
    name: "Snuffed Out Lowsec Gatecamp",
    description: "Famous lowsec pirate alliance with cyno hotdroppers and supercapital pilots",
    system: "Tama (0.3)",
    data: `Hy Wanto Destroyer
Tau AD
Perunga
Lussy Lou
Baltrom
Scary Cyno Alt
Wreckless Driver
Aura Scout
Bait Hauler
Innocent Miner`,
    pilots: `Hy Wanto Destroyer\nTau AD\nPerunga\nLussy Lou\nBaltrom\nScary Cyno Alt\nWreckless Driver\nAura Scout\nBait Hauler\nInnocent Miner`
  },
  {
    name: "Nullsec Staging (Pandemic Horde / Goonswarm)",
    description: "High traffic nullsec staging constellation roster",
    system: "MJ-5F9 (-0.5)",
    data: `Gobbins
Asher Elias
The Judge
Mist Amatin
Vily
Hedliner
Killah Bee
Fleet Commander Alpha
Super Pilot Prime
Tackle Frig 01`,
    pilots: `Gobbins\nAsher Elias\nThe Judge\nMist Amatin\nVily\nHedliner\nKillah Bee\nFleet Commander Alpha\nSuper Pilot Prime\nTackle Frig 01`
  }
];
