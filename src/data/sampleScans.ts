export interface SampleScanPreset {
  name: string;
  description: string;
  system: string;
  data: string;
}

export const SAMPLE_DSCANS: SampleScanPreset[] = [
  {
    name: "Ahbazon Pipe Gatecamp",
    description: "Infamous lowsec smartbombing & heavy tackle gatecamp with Marauders and Bubbles",
    system: "Ahbazon (0.4)",
    data: `Stiletto\tStiletto\t12 km
Broadsword\tBroadsword\t15 km
Flycatcher\tFlycatcher\t14 km
Paladin\tPaladin\t25 km
Vargur\tVargur\t28 km
Bhaalgorn\tBhaalgorn\t32 km
Lachesis\tLachesis\t54 km
Mobile Warp Disruptor II\tMobile Warp Disruptor II\t0 km
Mobile Warp Disruptor II\tMobile Warp Disruptor II\t45 km
Arazu\tArazu\t82 km
Guardian\tGuardian\t30 km
Oneiros\tOneiros\t28 km
Warp Disruption Probe\tWarp Disruption Probe\t8,500 m
Claw\tClaw\t18 km`
  },
  {
    name: "Nullsec Capital Brawl / Drop",
    description: "Revelation Dreadnoughts, FAX triage, Heavy Interdictors, and Cyno beacons",
    system: "1DQ1-A (-0.8)",
    data: `Revelation\tRevelation\t18 km
Moros Navy Issue\tMoros Navy Issue\t22 km
Naglfar Fleet Issue\tNaglfar Fleet Issue\t25 km
Apostle\tApostle\t15 km
Ninazu\tNinazu\t19 km
Sabre\tSabre\t10 km
Sabre\tSabre\t12 km
Devoter\tDevoter\t14 km
Mobile Cyno Beacon\tMobile Cyno Beacon\t18 km
Warp Disruption Probe\tWarp Disruption Probe\t5,000 m
Warp Disruption Probe\tWarp Disruption Probe\t7,200 m
Redeemer\tRedeemer\t35 km
Sin\tSin\t38 km
Widow\tWidow\t42 km
Muninn\tMuninn\t45 km
Muninn\tMuninn\t48 km
Cerberus\tCerberus\t52 km
Scimitar\tScimitar\t33 km
Scimitar\tScimitar\t36 km`
  },
  {
    name: "W-Space (J-Space) Brawling Comp",
    description: "Heavy armor T3Cs, Bhaalgorn heavy neuts, and logistics in high-class wormhole",
    system: "J115405 (C5 Pulsar)",
    data: `Loki\tLoki\t24 km
Loki\tLoki\t26 km
Legion\tLegion\t22 km
Legion\tLegion\t28 km
Proteus\tProteus\t15 km
Bhaalgorn\tBhaalgorn\t35 km
Nestor\tNestor\t20 km
Guardian\tGuardian\t18 km
Guardian\tGuardian\t22 km
Sabre\tSabre\t8 km
Heretic\tHeretic\t11 km
Mobile Depot\tMobile Depot\t120 km
Astrahus\tAstrahus\t14.2 AU`
  },
  {
    name: "Pochven Flashpoint Fleet",
    description: "Marauder and Triglavian high-efficiency site running comp",
    system: "Kraun (Pochven)",
    data: `Paladin\tPaladin\t12 km
Paladin\tPaladin\t14 km
Kronos\tKronos\t10 km
Vargur\tVargur\t16 km
Nestor\tNestor\t15 km
Nestor\tNestor\t18 km
Drekavac\tDrekavac\t22 km
Ikitursa\tIkitursa\t25 km
Oneiros\tOneiros\t20 km`
  }
];
