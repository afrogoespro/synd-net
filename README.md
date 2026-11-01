# AURA Tactical Recon // EVE Online Combat Suite

A high-performance, real-time Intel, Combat & Fleet Web Application for **EVE Online**, built for Fleet Commanders, scouts, Wormhole brawlers, and solo hunters.

![EVE Tactical Recon Suite](https://images.evetech.net/types/671/render?size=256)

---

## ⚡ Core Capabilities

### 1. 📡 Tactical Directional Scanner (D-Scan)
- **Direct Clipboard Ingest:** Paste directly from your in-game Directional Scanner (`Ctrl+A`, `Ctrl+C`).
- **Combat Threat Engine:** Automatically identifies and tags high-hazard targets:
  - **Interdiction Bubbles & Dictors:** Sabre, Flycatcher, Broadsword, Onyx, Mobile Warp Disruptors.
  - **Supercapitals & Capitals:** Titans, Supercarriers, Lancer Dreadnoughts, FAX triage carriers.
  - **Combat & Force Recons:** Curse, Pilgrim, Falcon, Rook, Huginn, Rapier, Lachesis, Arazu (cyno / ECM / extreme range webs).
  - **Fast Fleet Tackle:** Interceptors and Command Destroyers (booshers).
- **Distance Range Filters:** Instant filtering for `<1,000 km` (on grid), `<1 AU`, `<5 AU`, or max D-scan range (`14.3 AU`).
- **1-Click Discord Report:** Formatted markdown fleet breakdown ready to paste into fleet or discord intel channels.
- **Eve Image Server:** High-resolution 3D hull renders loaded directly from `https://images.evetech.net`.

### 2. 👥 Local Chat Intel Scanner
- **Pilot Roster Ingest:** Paste local chat pilot list (`Ctrl+A`, `Ctrl+C`).
- **Threat Matrix:** 
  - Calculates pilot danger rating and hostile count.
  - Flags potential Cynosural lighting alts and hotdroppers.
  - Highlights pilot security status (e.g. `-10.0` outlaw tags) and kill/loss ratios.
  - Groups pilots by corporation and alliance.
  - Instant links to live [zKillboard](https://zkillboard.com) profiles and [EveWho](https://evewho.com).

### 3. 💥 Live zKillboard Combat Feed
- Real-time killfeed displaying destruction across New Eden.
- Filter by security space: **Lowsec**, **Nullsec**, or **W-Space / Wormholes (J-space)**.
- Golden/red alerts for high-value kills (> 1B ISK) and Super/Capital kills.

### 4. 🛠️ EFT / Pyfa Fit Inspector
- Inspect raw EFT ship fits copied from Pyfa or the EVE client.
- Clean visual slot breakdown across Highs, Mids, Lows, Rigs, Subsystems, and Drone bay.

### 5. 🔊 Tactical Audio Alarms
- Browser-synthesized Web Audio API alarms for critical threat warnings and radar blips.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Launch Development Server
```bash
cd "C:\Users\brand\.gemini\antigravity\scratch\eve-intel-hub"
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```

---

## ⚖️ Legal & Copyright
EVE Online and the EVE logo are the registered trademarks of CCP hf. All rights are reserved worldwide. All EVE Online game images and assets are property of CCP hf.
