# 🗺️ Synd.net Operator Reference & Field Manual
*Real-Time EVE Online Reconnaissance, Fleet Tracking, Wormhole Mapping & Ore Valuation Suite*

---

## 1. Fleet Tracking & Multi-Pilot Positioning

### How Your Location Is Tracked (Hands-Free)
* **Automatic Detection**: The host player's location is parsed in real time directly from Windows EVE chatlogs (`Documents\EVE\logs\Chatlogs\Local_*.txt`).
* **Zero Tabbing Out**: Whenever you jump a stargate, enter a wormhole, or dock/undock, EVE logs `Channel changed to Local : <SystemName>`.
* **Instant Chain Linking**: Synd.net detects the jump in under 1 second, creates the system node, classifies the security level/wormhole class (e.g. `C2` with `C2 / Highsec` statics), links the path, and moves `Ennis Urbanski (You)` to that node.

### How Your Buddy's Location Is Tracked
Because your buddy connects remotely over the web browser, their browser sandbox cannot directly access local Windows files. Synd.net provides two methods for fleet members:

1. **One-Click "I'M HERE" Button**:
   * On the **Chain Mapper** screen, your buddy selects the system they are in (e.g. `J103955`).
   * In the **Fleet Pilot Location** box on the right inspector panel, they type their character name (e.g. `Syndra en Tilavine`) and click **"I'M HERE"**.
   * Their green pilot badge (`👤 Syndra en Tilavine`) immediately appears on that system node across **both** of your screens simultaneously!
2. **Automatic Synchronization**:
   * Both pilots' locations are broadcast over real-time Server-Sent Events (SSE) to port `3001` and the Cloudflare tunnel.

---

## 2. Essential Scripts & Commands

| Script / Command | Purpose | When to Use |
| :--- | :--- | :--- |
| `start.bat` | Launches the sync server and the Vite web interface on port 3000. | Start of every EVE roaming session. |
| `share-online.bat` | Starts the public Cloudflare tunnel to expose the app to your buddy. | When playing with remote fleet mates not on local Wi-Fi. |
| `stop.bat` | Gracefully terminates all background Node and server processes. | When closing EVE or shutting down Synd.net. |
| `npm run dev` | Runs the Vite local dev server with Hot Module Replacement. | Terminal development & testing. |
| `npm run sync-server` | Runs the EVE log watcher and multi-user sync server on port 3001. | Terminal sync server startup. |
| `npm run build` | Compiles TypeScript and builds production bundles into `dist/`. | Verifying code integrity before pushing. |

---

## 3. Pushing & Sharing Updates (Git & GitHub)

Your repository is initialized with a clean `.gitignore` (ignoring `node_modules`, `dist`, logs, and binaries).

### Step-by-Step GitHub Setup
1. Create a new empty repository at [github.com/new](https://github.com/new) (e.g., `synd-net`).
2. Open PowerShell in `C:\Users\brand\.gemini\antigravity\scratch\eve-intel-hub` and run:
   ```powershell
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git branch -M main
   git push -u origin main
   ```

### Daily Git Commands for Pushing Updates
```powershell
# 1. Check which files were modified
git status

# 2. Stage all modifications
git add .

# 3. Commit with a clear summary
git commit -m "feat: added new fleet tracking features"

# 4. Push updates to GitHub
git push
```

---

## 4. In-Game Recon Shortcuts (Zero Tabbing Out)

| Action | In-Game Keystroke | Synd.net Behavior |
| :--- | :--- | :--- |
| **D-Scan Structures** | Open D-Scan (`Alt+D`) &rarr; `Ctrl+A` &rarr; `Ctrl+C` | Automatically extracts Fortizars, Astras, Athanors, and poses; adds them to the active chain node. |
| **Probe Scan Sites** | Open Probe Window (`Alt+P`) &rarr; `Ctrl+A` &rarr; `Ctrl+C` | Identifies cosmic signatures (Relic, Data, Gas, Ore, Wormhole). |
| **High-Value Rock Alert** | Copying ore/gas signatures containing Bistot, Gneiss, or Fullerite | Highlights top profit density rocks and plays the **Jackpot Audio Alert**! |
| **System Jump** | Jump Stargate or Wormhole | Automatically tails Local chat and moves pilot location marker. |

---

## 5. Official Market Engine (CCP ESI Tranquility)

* **Direct ESI Ingestion**: Prices are polled directly from official CCP ESI:
  `https://esi.evetech.net/latest/markets/10000002/orders/?datasource=tranquility&order_type=sell&type_id=<ID>`
* **Outlier Filtering**: Eliminates troll sell orders (such as 98,000 ISK Bistot) by taking verified lowest market orders in Jita 4-4 (The Forge).
* **Profit Density Metric**: Ranks resources by $\text{ISK} / \text{m}^3$ so miners and haulers can cherry-pick high-density rocks before filling their cargo hold.

---

## 6. Troubleshooting Quick-Guide

* **Buddy sees "Bad Gateway (502)"**:
  * Ensure `npm run dev` is running on port 3000.
  * Ensure commands started through external tunnels run with host network binding.
* **Buddy sees "403 Forbidden" on trycloudflare.com**:
  * Vite 6 blocks unknown host headers by default. `server.allowedHosts: true` is enabled in `vite.config.ts`.
* **EVE Jumps Not Appearing**:
  * Verify EVE Online is writing logs to `Documents\EVE\logs\Chatlogs`.
  * Note: EVE writes chatlogs in **UTF-16LE** (UCS-2) format on Windows; `syncServer.cjs` is already configured for `utf16le` streams.
