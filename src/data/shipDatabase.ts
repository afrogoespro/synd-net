import { ShipInfo } from '../types/dscan';

// Comprehensive dictionary of EVE Online ships, hulls, structures, deployables, and threats
export const SHIP_DATABASE: Record<string, ShipInfo> = {
  // === TITANS ===
  "Avatar": { name: "Avatar", typeId: 11567, role: "Titan", group: "Capital Ship", threatLevel: "critical", threatReason: "Doomsday & Fleet Supercapital" },
  "Erebus": { name: "Erebus", typeId: 671, role: "Titan", group: "Capital Ship", threatLevel: "critical", threatReason: "Doomsday & Fleet Supercapital" },
  "Ragnarok": { name: "Ragnarok", typeId: 3764, role: "Titan", group: "Capital Ship", threatLevel: "critical", threatReason: "Doomsday & Fleet Supercapital" },
  "Leviathan": { name: "Leviathan", typeId: 11568, role: "Titan", group: "Capital Ship", threatLevel: "critical", threatReason: "Doomsday & Fleet Supercapital" },
  "Komodo": { name: "Komodo", typeId: 42126, role: "Titan", group: "Capital Ship", threatLevel: "critical", threatReason: "Pirate Faction Titan" },
  "Molok": { name: "Molok", typeId: 42241, role: "Titan", group: "Capital Ship", threatLevel: "critical", threatReason: "Blood Raider Titan" },
  "Vanquisher": { name: "Vanquisher", typeId: 42125, role: "Titan", group: "Capital Ship", threatLevel: "critical", threatReason: "Serpentis Titan" },

  // === SUPERCANIERS ===
  "Aeon": { name: "Aeon", typeId: 23919, role: "Supercarrier", group: "Capital Ship", threatLevel: "critical", threatReason: "Heavy Fighter Bombers & Burst Jammer" },
  "Nyx": { name: "Nyx", typeId: 23913, role: "Supercarrier", group: "Capital Ship", threatLevel: "critical", threatReason: "High DPS Heavy Fighter Bombers" },
  "Hel": { name: "Hel", typeId: 22852, role: "Supercarrier", group: "Capital Ship", threatLevel: "critical", threatReason: "Fast Shield Heavy Fighter Bombers" },
  "Wyvern": { name: "Wyvern", typeId: 23917, role: "Supercarrier", group: "Capital Ship", threatLevel: "critical", threatReason: "Shield Tank Supercarrier" },
  "Revenant": { name: "Revenant", typeId: 504, role: "Supercarrier", group: "Capital Ship", threatLevel: "critical", threatReason: "Pirate Supercarrier" },
  "Vendetta": { name: "Vendetta", typeId: 42132, role: "Supercarrier", group: "Capital Ship", threatLevel: "critical", threatReason: "Serpentis Supercarrier with Stasis Webifier" },

  // === DREADNOUGHTS ===
  "Revelation": { name: "Revelation", typeId: 19720, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Capital Siege Laser Platform" },
  "Moros": { name: "Moros", typeId: 19726, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Capital Siege Blaster Platform" },
  "Naglfar": { name: "Naglfar", typeId: 19724, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Capital Siege Projectile Platform" },
  "Phoenix": { name: "Phoenix", typeId: 19722, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Capital Siege Torpedo Platform" },
  "Revelation Navy Issue": { name: "Revelation Navy Issue", typeId: 72808, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Faction Dreadnought" },
  "Moros Navy Issue": { name: "Moros Navy Issue", typeId: 72809, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Faction Dreadnought" },
  "Naglfar Fleet Issue": { name: "Naglfar Fleet Issue", typeId: 72810, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Faction Dreadnought" },
  "Phoenix Navy Issue": { name: "Phoenix Navy Issue", typeId: 72811, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Faction Dreadnought" },
  "Zirnitra": { name: "Zirnitra", typeId: 52907, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Triglavian Ramp-up Dreadnought" },
  "Bane": { name: "Bane", typeId: 74141, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Lancer Dreadnought (Disrupts Cynos)" },
  "Karura": { name: "Karura", typeId: 74143, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Lancer Dreadnought" },
  "Hubris": { name: "Hubris", typeId: 74142, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Lancer Dreadnought" },
  "Valravn": { name: "Valravn", typeId: 74144, role: "Dreadnought", group: "Capital Ship", threatLevel: "critical", threatReason: "Lancer Dreadnought" },

  // === FORCE AUXILIARY (FAX) ===
  "Apostle": { name: "Apostle", typeId: 37604, role: "Force Auxiliary (FAX)", group: "Capital Ship", threatLevel: "high", threatReason: "Capital Remote Armor Repair" },
  "Ninazu": { name: "Ninazu", typeId: 37606, role: "Force Auxiliary (FAX)", group: "Capital Ship", threatLevel: "high", threatReason: "Capital Armor/Cap Remote Reps" },
  "Lif": { name: "Lif", typeId: 37607, role: "Force Auxiliary (FAX)", group: "Capital Ship", threatLevel: "high", threatReason: "Capital Shield Remote Reps" },
  "Minokawa": { name: "Minokawa", typeId: 37605, role: "Force Auxiliary (FAX)", group: "Capital Ship", threatLevel: "high", threatReason: "Capital Shield Remote Reps" },
  "Dagon": { name: "Dagon", typeId: 45530, role: "Force Auxiliary (FAX)", group: "Capital Ship", threatLevel: "critical", threatReason: "Blood Raider Faction FAX" },

  // === CARRIERS ===
  "Archon": { name: "Archon", typeId: 23757, role: "Carrier", group: "Capital Ship", threatLevel: "high", threatReason: "Fighter Support Platform" },
  "Thanatos": { name: "Thanatos", typeId: 23915, role: "Carrier", group: "Capital Ship", threatLevel: "high", threatReason: "Fighter Support Platform" },
  "Nidhoggur": { name: "Nidhoggur", typeId: 24483, role: "Carrier", group: "Capital Ship", threatLevel: "high", threatReason: "Fast Fighter Support Platform" },
  "Chimera": { name: "Chimera", typeId: 23911, role: "Carrier", group: "Capital Ship", threatLevel: "high", threatReason: "Shield Tank Fighter Platform" },

  // === BLACK OPS ===
  "Redeemer": { name: "Redeemer", typeId: 22428, role: "Black Ops", group: "Battleship", threatLevel: "critical", threatReason: "Covert Jump Portal / Hotdropper", isCynoCapable: true },
  "Sin": { name: "Sin", typeId: 22430, role: "Black Ops", group: "Battleship", threatLevel: "critical", threatReason: "Covert Jump Portal / Drone Hotdropper", isCynoCapable: true },
  "Panther": { name: "Panther", typeId: 22440, role: "Black Ops", group: "Battleship", threatLevel: "critical", threatReason: "Covert Jump Portal / Fast Projectile", isCynoCapable: true },
  "Widow": { name: "Widow", typeId: 22436, role: "Black Ops", group: "Battleship", threatLevel: "critical", threatReason: "Covert Jump Portal / ECM Jammer", isCynoCapable: true },

  // === MARAUDERS ===
  "Paladin": { name: "Paladin", typeId: 28659, role: "Marauder", group: "Battleship", threatLevel: "high", threatReason: "Bastion Mode / Extreme Armor Tank & Beam DPS" },
  "Kronos": { name: "Kronos", typeId: 28665, role: "Marauder", group: "Battleship", threatLevel: "high", threatReason: "Bastion Mode / Extreme Close-Range Blaster DPS" },
  "Vargur": { name: "Vargur", typeId: 28661, role: "Marauder", group: "Battleship", threatLevel: "high", threatReason: "Bastion Mode / Shield Active Tank & Autocannons" },
  "Golem": { name: "Golem", typeId: 28656, role: "Marauder", group: "Battleship", threatLevel: "high", threatReason: "Bastion Mode / Shield Active Tank & Torpedoes" },

  // === BATTLESHIPS ===
  "Megathron": { name: "Megathron", typeId: 641, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Megathron Navy Issue": { name: "Megathron Navy Issue", typeId: 17726, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Dominix": { name: "Dominix", typeId: 645, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Dominix Navy Issue": { name: "Dominix Navy Issue", typeId: 17728, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Hyperion": { name: "Hyperion", typeId: 24690, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Apocalypse": { name: "Apocalypse", typeId: 642, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Apocalypse Navy Issue": { name: "Apocalypse Navy Issue", typeId: 17729, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Armageddon": { name: "Armageddon", typeId: 643, role: "Battleship", group: "Battleship", threatLevel: "high", threatReason: "Heavy Energy Neut & Drones" },
  "Armageddon Navy Issue": { name: "Armageddon Navy Issue", typeId: 32305, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Abaddon": { name: "Abaddon", typeId: 24692, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Raven": { name: "Raven", typeId: 638, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Raven Navy Issue": { name: "Raven Navy Issue", typeId: 17736, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Scorpion": { name: "Scorpion", typeId: 640, role: "Battleship", group: "Battleship", threatLevel: "high", threatReason: "Fleet ECM Jammer" },
  "Scorpion Navy Issue": { name: "Scorpion Navy Issue", typeId: 32309, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Rokh": { name: "Rokh", typeId: 24688, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Tempest": { name: "Tempest", typeId: 639, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Tempest Fleet Issue": { name: "Tempest Fleet Issue", typeId: 17732, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Typhoon": { name: "Typhoon", typeId: 644, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Typhoon Fleet Issue": { name: "Typhoon Fleet Issue", typeId: 17734, role: "Battleship", group: "Battleship", threatLevel: "high" },
  "Maelstrom": { name: "Maelstrom", typeId: 24694, role: "Battleship", group: "Battleship", threatLevel: "medium" },
  "Bhaalgorn": { name: "Bhaalgorn", typeId: 17920, role: "Battleship", group: "Battleship", threatLevel: "critical", threatReason: "Lethal Cap Neutralizer & Heavy Webifiers" },
  "Machariel": { name: "Machariel", typeId: 17738, role: "Battleship", group: "Battleship", threatLevel: "high", threatReason: "Ultra-fast Battleship with high alpha" },
  "Nightmare": { name: "Nightmare", typeId: 17736, role: "Battleship", group: "Battleship", threatLevel: "high", threatReason: "Fast AB Laser & Shield Battleship" },
  "Vindicator": { name: "Vindicator", typeId: 17740, role: "Battleship", group: "Battleship", threatLevel: "critical", threatReason: "90% Webifier & Devastating Blasters" },
  "Rattlesnake": { name: "Rattlesnake", typeId: 17918, role: "Battleship", group: "Battleship", threatLevel: "high", threatReason: "Massive passive shield tank & Heavy Drones" },
  "Nestor": { name: "Nestor", typeId: 33472, role: "Battleship", group: "Battleship", threatLevel: "high", threatReason: "Armor Logistics & Refitting Bay" },
  "Leshak": { name: "Leshak", typeId: 47466, role: "Battleship", group: "Battleship", threatLevel: "high", threatReason: "Spooling Entropic Disintegrator" },
  "Praxis": { name: "Praxis", typeId: 47271, role: "Battleship", group: "Battleship", threatLevel: "medium" },

  // === COMBAT RECONS (D-SCAN IMMUNE IN GAME! If visible in local/overview, beware!) ===
  "Curse": { name: "Curse", typeId: 11957, role: "Combat Recon", group: "Cruiser", threatLevel: "critical", threatReason: "D-Scan Immune / Heavy Neut & Tracking Disruptor", isCombatRecon: true },
  "Pilgrim": { name: "Pilgrim", typeId: 11965, role: "Force Recon", group: "Cruiser", threatLevel: "critical", threatReason: "Cloaky Neut / Cyno Capable", isCynoCapable: true },
  "Falcon": { name: "Falcon", typeId: 11959, role: "Force Recon", group: "Cruiser", threatLevel: "critical", threatReason: "Cloaky ECM Jammer / Cyno Capable", isCynoCapable: true },
  "Rook": { name: "Rook", typeId: 11961, role: "Combat Recon", group: "Cruiser", threatLevel: "critical", threatReason: "D-Scan Immune / ECM Jammer", isCombatRecon: true },
  "Huginn": { name: "Huginn", typeId: 11969, role: "Combat Recon", group: "Cruiser", threatLevel: "critical", threatReason: "D-Scan Immune / Long-Range Webifier & Target Paint", isCombatRecon: true },
  "Rapier": { name: "Rapier", typeId: 11963, role: "Force Recon", group: "Cruiser", threatLevel: "critical", threatReason: "Cloaky Long-Range Webifier / Cyno Capable", isCynoCapable: true },
  "Lachesis": { name: "Lachesis", typeId: 11967, role: "Combat Recon", group: "Cruiser", threatLevel: "critical", threatReason: "D-Scan Immune / Long-Range Warp Disruptor (>60km)", isCombatRecon: true },
  "Arazu": { name: "Arazu", typeId: 11971, role: "Force Recon", group: "Cruiser", threatLevel: "critical", threatReason: "Cloaky Long-Range Point & Cyno", isCynoCapable: true },

  // === HEAVY INTERDICTORS (HICs) ===
  "Broadsword": { name: "Broadsword", typeId: 12019, role: "Heavy Interdictor (HIC)", group: "Cruiser", threatLevel: "critical", threatReason: "Infinite Tackle Warp Disruption Bubble", isBubbler: true },
  "Devoter": { name: "Devoter", typeId: 12011, role: "Heavy Interdictor (HIC)", group: "Cruiser", threatLevel: "critical", threatReason: "Infinite Tackle Warp Disruption Bubble", isBubbler: true },
  "Phobos": { name: "Phobos", typeId: 12015, role: "Heavy Interdictor (HIC)", group: "Cruiser", threatLevel: "critical", threatReason: "Infinite Tackle Warp Disruption Bubble", isBubbler: true },
  "Onyx": { name: "Onyx", typeId: 12023, role: "Heavy Interdictor (HIC)", group: "Cruiser", threatLevel: "critical", threatReason: "Infinite Tackle Warp Disruption Bubble", isBubbler: true },

  // === INTERDICTORS (DICTORS) ===
  "Sabre": { name: "Sabre", typeId: 22456, role: "Interdictor (Dictor)", group: "Destroyer", threatLevel: "critical", threatReason: "Warp Disruption Bubble Launcher", isBubbler: true },
  "Flycatcher": { name: "Flycatcher", typeId: 22464, role: "Interdictor (Dictor)", group: "Destroyer", threatLevel: "critical", threatReason: "Warp Disruption Bubble Launcher", isBubbler: true },
  "Heretic": { name: "Heretic", typeId: 22460, role: "Interdictor (Dictor)", group: "Destroyer", threatLevel: "critical", threatReason: "Warp Disruption Bubble Launcher", isBubbler: true },
  "Eris": { name: "Eris", typeId: 22452, role: "Interdictor (Dictor)", group: "Destroyer", threatLevel: "critical", threatReason: "Warp Disruption Bubble Launcher", isBubbler: true },

  // === COMMAND DESTROYERS (BOOSHERS) ===
  "Bifrost": { name: "Bifrost", typeId: 37482, role: "Command Destroyer", group: "Destroyer", threatLevel: "high", threatReason: "Micro Jump Field Generator (Boosher)" },
  "Pontifex": { name: "Pontifex", typeId: 37453, role: "Command Destroyer", group: "Destroyer", threatLevel: "high", threatReason: "Micro Jump Field Generator (Boosher)" },
  "Stork": { name: "Stork", typeId: 37481, role: "Command Destroyer", group: "Destroyer", threatLevel: "high", threatReason: "Micro Jump Field Generator (Boosher)" },
  "Magus": { name: "Magus", typeId: 37483, role: "Command Destroyer", group: "Destroyer", threatLevel: "high", threatReason: "Micro Jump Field Generator (Boosher)" },

  // === STRATEGIC CRUISERS (T3C) ===
  "Loki": { name: "Loki", typeId: 29990, role: "Strategic Cruiser (T3C)", group: "Cruiser", threatLevel: "high", threatReason: "Covert Web/Artillery or Shield Skirmish" },
  "Tengu": { name: "Tengu", typeId: 29984, role: "Strategic Cruiser (T3C)", group: "Cruiser", threatLevel: "high", threatReason: "Covert Missile or ECM Jammer" },
  "Legion": { name: "Legion", typeId: 29986, role: "Strategic Cruiser (T3C)", group: "Cruiser", threatLevel: "high", threatReason: "Covert Neut / Heavy Armor Laser" },
  "Proteus": { name: "Proteus", typeId: 29988, role: "Strategic Cruiser (T3C)", group: "Cruiser", threatLevel: "high", threatReason: "Covert Close-Range Blaster / Web" },

  // === HEAVY ASSAULT CRUISERS (HACs) ===
  "Cerberus": { name: "Cerberus", typeId: 11993, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Long-Range RLML/HML Fleet DPS" },
  "Eagle": { name: "Eagle", typeId: 12005, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Sniper Railgun Platform" },
  "Zealot": { name: "Zealot", typeId: 12003, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Armor Beam/Pulse Laser" },
  "Deimos": { name: "Deimos", typeId: 12001, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Active Armor Blaster Cruiser" },
  "Sacrilege": { name: "Sacrilege", typeId: 11999, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Armor HAM/Missile Cruiser" },
  "Ishtar": { name: "Ishtar", typeId: 12007, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Heavy Drones & Sentry Platform" },
  "Vagabond": { name: "Vagabond", typeId: 11995, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Fast Skirmish Kiter" },
  "Muninn": { name: "Muninn", typeId: 12009, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "medium", threatReason: "Fleet Missile Cruiser" },

  // === LOGISTICS CRUISERS ===
  "Guardian": { name: "Guardian", typeId: 11987, role: "Logistics Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "Armor Remote Repair & Cap Transfer" },
  "Oneiros": { name: "Oneiros", typeId: 11985, role: "Logistics Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "Armor Remote Repair" },
  "Scimitar": { name: "Scimitar", typeId: 11978, role: "Logistics Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "Shield Remote Repair" },
  "Basilisk": { name: "Basilisk", typeId: 11989, role: "Logistics Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "Shield Remote Repair & Cap Transfer" },

  // === COMMAND SHIPS ===
  "Damnation": { name: "Damnation", typeId: 22448, role: "Command Ship", group: "Battlecruiser", threatLevel: "high", threatReason: "Heavy Armor Fleet Boosts" },
  "Absolution": { name: "Absolution", typeId: 22446, role: "Command Ship", group: "Battlecruiser", threatLevel: "high" },
  "Nighthawk": { name: "Nighthawk", typeId: 22444, role: "Command Ship", group: "Battlecruiser", threatLevel: "high", threatReason: "Shield Fleet Boosts" },
  "Vulture": { name: "Vulture", typeId: 22442, role: "Command Ship", group: "Battlecruiser", threatLevel: "high", threatReason: "Shield Fleet Boosts" },
  "Astarte": { name: "Astarte", typeId: 22468, role: "Command Ship", group: "Battlecruiser", threatLevel: "high" },
  "Eos": { name: "Eos", typeId: 22470, role: "Command Ship", group: "Battlecruiser", threatLevel: "high", threatReason: "Armor Drone Boosts" },
  "Sleipnir": { name: "Sleipnir", typeId: 22466, role: "Command Ship", group: "Battlecruiser", threatLevel: "high", threatReason: "Shield Fleet Boosts & Autocannons" },
  "Claymore": { name: "Claymore", typeId: 22464, role: "Command Ship", group: "Battlecruiser", threatLevel: "high", threatReason: "Shield Skirmish Boosts" },

  // === STEALTH BOMBERS ===
  "Nemesis": { name: "Nemesis", typeId: 12038, role: "Stealth Bomber", group: "Frigate", threatLevel: "high", threatReason: "Cloaked Torpedoes & Bomb Launcher" },
  "Purifier": { name: "Purifier", typeId: 12032, role: "Stealth Bomber", group: "Frigate", threatLevel: "high", threatReason: "Cloaked Torpedoes & Bomb Launcher" },
  "Manticore": { name: "Manticore", typeId: 12034, role: "Stealth Bomber", group: "Frigate", threatLevel: "high", threatReason: "Cloaked Torpedoes & Bomb Launcher" },
  "Hound": { name: "Hound", typeId: 12036, role: "Stealth Bomber", group: "Frigate", threatLevel: "high", threatReason: "Cloaked Torpedoes & Bomb Launcher" },

  // === INTERCEPTORS ===
  "Stiletto": { name: "Stiletto", typeId: 11184, role: "Interceptor", group: "Frigate", threatLevel: "critical", threatReason: "Fast Fleet Tackle (Bubble Immune)" },
  "Claw": { name: "Claw", typeId: 11186, role: "Interceptor", group: "Frigate", threatLevel: "high", threatReason: "Fast Tackle" },
  "Crow": { name: "Crow", typeId: 11176, role: "Interceptor", group: "Frigate", threatLevel: "critical", threatReason: "Fast Fleet Tackle (Bubble Immune)" },
  "Raptor": { name: "Raptor", typeId: 11178, role: "Interceptor", group: "Frigate", threatLevel: "high", threatReason: "Fast Tackle" },
  "Ares": { name: "Ares", typeId: 11198, role: "Interceptor", group: "Frigate", threatLevel: "critical", threatReason: "Fast Fleet Tackle (Bubble Immune)" },
  "Taranis": { name: "Taranis", typeId: 11196, role: "Interceptor", group: "Frigate", threatLevel: "high", threatReason: "Blaster Interceptor" },
  "Malediction": { name: "Malediction", typeId: 11192, role: "Interceptor", group: "Frigate", threatLevel: "critical", threatReason: "Fast Fleet Tackle (Bubble Immune)" },
  "Crusader": { name: "Crusader", typeId: 11194, role: "Interceptor", group: "Frigate", threatLevel: "high", threatReason: "Fast Tackle" },

  // === BUBBLES & DEPLOYABLES ===
  "Mobile Warp Disruptor I": { name: "Mobile Warp Disruptor I", typeId: 26888, role: "Interdiction Bubble", group: "Deployable", threatLevel: "critical", threatReason: "Anchored Warp Disruption Bubble", isBubbler: true },
  "Mobile Warp Disruptor II": { name: "Mobile Warp Disruptor II", typeId: 26890, role: "Interdiction Bubble", group: "Deployable", threatLevel: "critical", threatReason: "Anchored T2 Warp Disruption Bubble (20km radius)", isBubbler: true },
  "Synde Mobile Warp Disruptor": { name: "Synde Mobile Warp Disruptor", typeId: 26892, role: "Interdiction Bubble", group: "Deployable", threatLevel: "critical", threatReason: "Faction Warp Disruption Bubble", isBubbler: true },
  "Warp Disruption Probe": { name: "Warp Disruption Probe", typeId: 22780, role: "Interdiction Bubble", group: "Deployable", threatLevel: "critical", threatReason: "Active Interdictor Bubble Sphere", isBubbler: true },
  "Cynosural Beacon": { name: "Cynosural Beacon", typeId: 35894, role: "Citadel / Upwell", group: "Structure", threatLevel: "high", threatReason: "Structure Cyno Jump Target" },
  "Mobile Cyno Beacon": { name: "Mobile Cyno Beacon", typeId: 58839, role: "Deployable / Sentry", group: "Deployable", threatLevel: "critical", threatReason: "Anchored Capital Cyno Destination", isCynoCapable: true },
  "Mobile Cyno Inhibitor": { name: "Mobile Cyno Inhibitor", typeId: 33475, role: "Deployable / Sentry", group: "Deployable", threatLevel: "high", threatReason: "Prevents Cynosural Field lighting within 100km" },
  "Mobile Depot": { name: "Mobile Depot", typeId: 33474, role: "Deployable / Sentry", group: "Deployable", threatLevel: "neutral" },
  "Wetu Mobile Depot": { name: "Wetu Mobile Depot", typeId: 33475, role: "Deployable / Sentry", group: "Deployable", threatLevel: "neutral" },

  // === POPULAR FACTION CRUISERS & PIRATE SHIPS ===
  "Gila": { name: "Gila", typeId: 17930, role: "Cruiser", group: "Cruiser", threatLevel: "medium", threatReason: "Massive Shield Tank & Heavy Drones" },
  "Orthrus": { name: "Orthrus", typeId: 33818, role: "Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "Fast Defensive Point & Long-Range Missiles" },
  "Stratios": { name: "Stratios", typeId: 33470, role: "Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "Covert Cloak Drone Cruiser & Neut" },
  "Ashimmu": { name: "Ashimmu", typeId: 17922, role: "Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "Cap Neutralizer & Webifier" },
  "Cynabal": { name: "Cynabal", typeId: 17720, role: "Cruiser", group: "Cruiser", threatLevel: "medium", threatReason: "Fast Warp Skirmisher" },
  "Vigilant": { name: "Vigilant", typeId: 17722, role: "Cruiser", group: "Cruiser", threatLevel: "high", threatReason: "90% Webifier & Blaster DPS" },
  "Phantasm": { name: "Phantasm", typeId: 17718, role: "Cruiser", group: "Cruiser", threatLevel: "medium", threatReason: "Afterburner Laser Cruiser" },
  "Ikitursa": { name: "Ikitursa", typeId: 52252, role: "Heavy Assault Cruiser (HAC)", group: "Cruiser", threatLevel: "high", threatReason: "Triglavian Assault Disintegrator" },
  "Drekavac": { name: "Drekavac", typeId: 49712, role: "Battlecruiser", group: "Battlecruiser", threatLevel: "high", threatReason: "Triglavian Battlecruiser" },

  // === POPULAR FRIGATES ===
  "Worm": { name: "Worm", typeId: 17932, role: "Frigate", group: "Frigate", threatLevel: "medium" },
  "Garmur": { name: "Garmur", typeId: 33816, role: "Frigate", group: "Frigate", threatLevel: "high", threatReason: "Long-Range Scram / Point & Extreme Speed" },
  "Astero": { name: "Astero", typeId: 33468, role: "Covert Ops", group: "Frigate", threatLevel: "medium", threatReason: "Covert Cloak Exploration / Tackle" },
  "Daredevil": { name: "Daredevil", typeId: 17924, role: "Frigate", group: "Frigate", threatLevel: "high", threatReason: "90% Webifier Frigate" },
  "Succubus": { name: "Succubus", typeId: 17926, role: "Frigate", group: "Frigate", threatLevel: "medium" },
  "Cruor": { name: "Cruor", typeId: 17928, role: "Frigate", group: "Frigate", threatLevel: "high", threatReason: "Cap Neut & Webifier" },
  "Dramiel": { name: "Dramiel", typeId: 17715, role: "Frigate", group: "Frigate", threatLevel: "medium" },
  "Nergal": { name: "Nergal", typeId: 52250, role: "Assault Frigate", group: "Frigate", threatLevel: "high" },

  // === STRUCTURES ===
  "Astrahus": { name: "Astrahus", typeId: 35832, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure" },
  "Fortizar": { name: "Fortizar", typeId: 35833, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure" },
  "Keepstar": { name: "Keepstar", typeId: 35834, role: "Citadel / Upwell", group: "Structure", threatLevel: "critical", threatReason: "Supercapital Docking Citadel & Doomsday" },
  "Raitaru": { name: "Raitaru", typeId: 35825, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure" },
  "Azbel": { name: "Azbel", typeId: 35826, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure" },
  "Sotiyo": { name: "Sotiyo", typeId: 35827, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure" },
  "Athanor": { name: "Athanor", typeId: 35835, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure" },
  "Tatara": { name: "Tatara", typeId: 35836, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure" },
  "Ansiblex Jump Gate": { name: "Ansiblex Jump Gate", typeId: 35841, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure", threatReason: "Alliance Fast Jump Bridge" },
  "Tenebrex Cyno Jammer": { name: "Tenebrex Cyno Jammer", typeId: 35840, role: "Citadel / Upwell", group: "Structure", threatLevel: "structure", threatReason: "System Cyno Jammer Structure" }
};

// Fallback pattern matcher for unknown ships or custom named items
export function resolveShipInfo(itemType: string, itemName?: string): ShipInfo {
  const cleanType = itemType.trim();

  // Direct lookup
  if (SHIP_DATABASE[cleanType]) {
    return SHIP_DATABASE[cleanType];
  }

  // Check known keywords in itemType
  const lower = cleanType.toLowerCase();

  if (lower.includes('bubble') || lower.includes('disruption probe') || lower.includes('disruptor')) {
    return { name: cleanType, role: 'Interdiction Bubble', group: 'Deployable', threatLevel: 'critical', threatReason: 'Warp Disruption Field Detected', isBubbler: true };
  }
  if (lower.includes('wormhole') || (itemName && itemName.toLowerCase().includes('wormhole')) || cleanType.toUpperCase() === 'K162' || (itemName && itemName.toUpperCase().includes('K162'))) {
    return { name: cleanType, role: 'Wormhole', group: 'Celestial / Space Object', typeId: 296, threatLevel: 'neutral', threatReason: 'Wormhole Spatial Connection' };
  }
  if (lower.includes('titan')) {
    return { name: cleanType, role: 'Titan', group: 'Capital Ship', threatLevel: 'critical', threatReason: 'Titan Detected' };
  }
  if (lower.includes('dreadnought') || lower.includes('dread')) {
    return { name: cleanType, role: 'Dreadnought', group: 'Capital Ship', threatLevel: 'critical', threatReason: 'Capital Siege Threat' };
  }
  if (lower.includes('carrier')) {
    return { name: cleanType, role: 'Carrier', group: 'Capital Ship', threatLevel: 'high' };
  }
  if (lower.includes('supercarrier')) {
    return { name: cleanType, role: 'Supercarrier', group: 'Capital Ship', threatLevel: 'critical' };
  }
  if (lower.includes('battleship')) {
    return { name: cleanType, role: 'Battleship', group: 'Battleship', threatLevel: 'high' };
  }
  if (lower.includes('interdictor')) {
    return { name: cleanType, role: 'Interdictor (Dictor)', group: 'Destroyer', threatLevel: 'critical', threatReason: 'Bubble capable', isBubbler: true };
  }
  if (lower.includes('interceptor')) {
    return { name: cleanType, role: 'Interceptor', group: 'Frigate', threatLevel: 'high', threatReason: 'Fast Tackle' };
  }
  if (lower.includes('bomber')) {
    return { name: cleanType, role: 'Stealth Bomber', group: 'Frigate', threatLevel: 'high', threatReason: 'Cloaked Torpedoes / Bombs' };
  }
  if (lower.includes('drone') || lower.includes('infiltrator') || lower.includes('hammerhead') || lower.includes('gecko') || lower.includes('warrior')) {
    return { name: cleanType, role: 'Drone / Fighter', group: 'Drone', threatLevel: 'low' };
  }
  if (lower.includes('wreck')) {
    return { name: cleanType, role: 'Wreck / Container', group: 'Space Object', threatLevel: 'neutral' };
  }
  if (lower.includes('citadel') || lower.includes('refinery') || lower.includes('engineering complex')) {
    return { name: cleanType, role: 'Citadel / Upwell', group: 'Structure', threatLevel: 'structure' };
  }

  return {
    name: cleanType,
    role: 'Unknown',
    group: 'Other',
    threatLevel: 'neutral'
  };
}
