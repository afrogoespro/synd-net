/**
 * SYND.NET LIVE CHAIN MAPPER & SYNC SERVER
 * Broadcasts wormhole scans, jumps, and structures to you and your buddy in real-time!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = 3001;

// Global Shared Chain State
let chainMap = {
  systems: {
    'Jita': {
      id: 'Jita',
      name: 'Jita',
      systemClass: 'Highsec',
      statics: [],
      structures: [],
      activePilots: [],
      signatures: [],
      lastUpdated: new Date().toLocaleTimeString()
    }
  },
  connections: [],
  onlineBuddies: ['Scout Alpha (You)']
};

let lastActiveSystem = 'Jita';

// Connected SSE clients (browsers of you and your buddy)
let sseClients = [];

function broadcastUpdate(type, payload) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  sseClients.forEach(res => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (e) {}
  });
}

const server = http.createServer((req, res) => {
  // Allow LAN access so your buddy can connect from their laptop/PC
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // SSE Stream for Real-time instant sync between buddies
  if (req.url === '/api/map/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send initial full map immediately upon buddy connecting
    res.write(`data: ${JSON.stringify({ type: 'INIT', payload: chainMap })}\n\n`);

    sseClients.push(res);
    console.log(`[Buddy Connected] Active listeners: ${sseClients.length}`);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
      console.log(`[Buddy Disconnected] Active listeners: ${sseClients.length}`);
    });
    return;
  }

  // Get current map state
  if (req.url === '/api/map' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(chainMap));
    return;
  }

  // Update map (e.g. pilot scanned structures or added wormhole)
  if (req.url === '/api/map/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);

        // System update
        if (update.system) {
          const sysId = update.system.id || update.system.name;
          const existing = chainMap.systems[sysId] || {
            id: sysId,
            name: sysId,
            systemClass: update.system.systemClass || 'Unknown',
            statics: update.system.statics || [],
            structures: [],
            activePilots: [],
            signatures: []
          };

          // Merge structures (avoid duplicate names)
          if (update.structures && Array.isArray(update.structures)) {
            const currentStructs = existing.structures || [];
            update.structures.forEach(ns => {
              const idx = currentStructs.findIndex(s => s.name === ns.name);
              if (idx >= 0) {
                currentStructs[idx] = { ...currentStructs[idx], ...ns };
              } else {
                currentStructs.push({
                  id: `struct-${Date.now()}-${Math.random()}`,
                  name: ns.name,
                  type: ns.type,
                  distance: ns.distance || '-',
                  scoutedBy: update.pilotName || 'Buddy',
                  timestamp: new Date().toLocaleTimeString()
                });
              }
            });
            existing.structures = currentStructs;
          }

          existing.lastUpdated = new Date().toLocaleTimeString();
          chainMap.systems[sysId] = existing;

          // If new connection from previous system
          if (update.fromSystem && update.fromSystem !== sysId) {
            const connExists = chainMap.connections.some(
              c => (c.from === update.fromSystem && c.to === sysId) || (c.from === sysId && c.to === update.fromSystem)
            );
            if (!connExists) {
              chainMap.connections.push({
                id: `conn-${Date.now()}`,
                from: update.fromSystem,
                to: sysId,
                wormholeType: update.wormholeType || 'Wormhole',
                massStatus: 'stable',
                timeStatus: 'stable'
              });
            }
          }

          lastActiveSystem = sysId;
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[Shared Map] Updated ${sysId} with ${existing.structures.length} structures`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, chainMap }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Clear or reset map
  if (req.url === '/api/map/clear' && req.method === 'POST') {
    chainMap = {
      systems: {
        'Jita': {
          id: 'Jita',
          name: 'Jita',
          systemClass: 'Highsec',
          statics: [],
          structures: [],
          activePilots: [],
          signatures: [],
          lastUpdated: new Date().toLocaleTimeString()
        }
      },
      connections: [],
      onlineBuddies: ['Scout Alpha (You)']
    };
    broadcastUpdate('MAP_UPDATE', chainMap);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

// =========================================================================
// Real-Time EVE Client Location Follower (Zero Copy-Paste, Zero Tabbing Out)
// Tails EVE Local Chatlogs & Gamelogs to automatically follow character jumps!
// =========================================================================

function findEveLogsDir() {
  const candidates = [
    'C:\\Users\\brand\\Documents\\EVE\\logs',
    path.join(os.homedir(), 'Documents', 'EVE', 'logs'),
    path.join(os.homedir(), 'OneDrive', 'Documents', 'EVE', 'logs')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const eveLogsBase = findEveLogsDir();
console.log(`[EVE Location Follower] EVE Logs directory: ${eveLogsBase || 'NOT FOUND'}`);

function handleSystemTransition(newSys, fromSys) {
  if (!newSys) return;
  newSys = newSys.trim();
  if (newSys === lastActiveSystem) return;

  const previous = fromSys || lastActiveSystem;
  console.log(`\n🚀 [EVE LOCATION FOLLOWER] Character jump detected: ${previous} ➔ ${newSys}`);
  lastActiveSystem = newSys;

  // Classify system (Wormhole C1-C6, Highsec, Lowsec, Nullsec)
  let whClass = 'Highsec';
  if (newSys.startsWith('J')) {
    const num = parseInt(newSys.replace(/\D/g, ''), 10) || 0;
    if (num >= 100000 && num <= 119999) whClass = 'C2';
    else if (num >= 120000 && num <= 139999) whClass = 'C2';
    else if (num >= 140000 && num <= 159999) whClass = 'C3';
    else if (num >= 160000 && num <= 179999) whClass = 'C4';
    else if (num >= 180000 && num <= 199999) whClass = 'C5';
    else if (num >= 200000 && num <= 219999) whClass = 'C6';
    else whClass = 'C2';
  }

  if (!chainMap.systems[newSys]) {
    chainMap.systems[newSys] = {
      id: newSys,
      name: newSys,
      systemClass: whClass,
      statics: whClass === 'C2' ? ['C2', 'Highsec'] : whClass === 'C3' ? ['Lowsec'] : [],
      structures: [],
      activePilots: ['Ennis Urbanski (You)'],
      signatures: [],
      lastUpdated: new Date().toLocaleTimeString()
    };
  }

  // Connect previous system to new system
  if (previous && previous !== newSys) {
    const connExists = chainMap.connections.some(
      c => (c.from === previous && c.to === newSys) || (c.from === newSys && c.to === previous)
    );
    if (!connExists) {
      chainMap.connections.push({
        id: `conn-${Date.now()}`,
        from: previous,
        to: newSys,
        wormholeType: newSys.startsWith('J') || previous.startsWith('J') ? 'Wormhole' : 'Stargate',
        massStatus: 'stable',
        timeStatus: 'stable'
      });
    }
  }

  broadcastUpdate('MAP_UPDATE', chainMap);
  broadcastUpdate('JUMP', { systemName: newSys, fromSystem: previous });
}

// 1. Tail Local Chatlogs (Fires instantly on EVERY wormhole & gate jump)
let activeLocalFile = null;
let localFileSize = 0;

function getLatestLocalChatFile() {
  if (!eveLogsBase) return null;
  const chatDir = path.join(eveLogsBase, 'Chatlogs');
  if (!fs.existsSync(chatDir)) return null;

  const files = fs.readdirSync(chatDir)
    .filter(f => f.startsWith('Local_') && f.endsWith('.txt'))
    .map(f => {
      const full = path.join(chatDir, f);
      return { file: full, mtime: fs.statSync(full).mtime.getTime() };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].file : null;
}

// Read current location and chain on boot
const initialLocal = getLatestLocalChatFile();
if (initialLocal) {
  try {
    const content = fs.readFileSync(initialLocal, 'utf16le');
    const matches = [...content.matchAll(/Channel changed to Local\s*:\s*([A-Za-z0-9\-]+)/gi)];
    if (matches.length > 0) {
      console.log(`[EVE Location Follower] Discovered ${matches.length} system jumps in local session!`);
      // Replay all jumps from session into chain map
      let prev = null;
      for (const m of matches) {
        const sys = m[1].trim();
        handleSystemTransition(sys, prev);
        prev = sys;
      }
      const currentLoc = matches[matches.length - 1][1].trim();
      console.log(`[EVE Location Follower] Current active character location: ${currentLoc}`);
    }
  } catch (e) {
    console.error('[EVE Location Follower] Initial chat log read error', e);
  }
}

// Poll Local chatlog every 800ms
setInterval(() => {
  const latest = getLatestLocalChatFile();
  if (latest && latest !== activeLocalFile) {
    activeLocalFile = latest;
    localFileSize = fs.existsSync(latest) ? fs.statSync(latest).size : 0;
  }

  if (!activeLocalFile || !fs.existsSync(activeLocalFile)) return;
  const stat = fs.statSync(activeLocalFile);
  if (stat.size > localFileSize) {
    const stream = fs.createReadStream(activeLocalFile, {
      start: localFileSize,
      end: stat.size,
      encoding: 'utf16le'
    });
    let buffer = '';
    stream.on('data', chunk => { buffer += chunk; });
    stream.on('end', () => {
      localFileSize = stat.size;
      const matches = [...buffer.matchAll(/Channel changed to Local\s*:\s*([A-Za-z0-9\-]+)/gi)];
      for (const m of matches) {
        handleSystemTransition(m[1]);
      }
    });
  }
}, 800);

// 2. Tail Gamelogs (Catches gate jumps & undocks)
let activeGameLog = null;
let gameLogSize = 0;

function getLatestGamelogFile() {
  if (!eveLogsBase) return null;
  const gameDir = path.join(eveLogsBase, 'Gamelogs');
  if (!fs.existsSync(gameDir)) return null;

  const files = fs.readdirSync(gameDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => {
      const full = path.join(gameDir, f);
      return { file: full, mtime: fs.statSync(full).mtime.getTime() };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].file : null;
}

setInterval(() => {
  const latest = getLatestGamelogFile();
  if (latest && latest !== activeGameLog) {
    activeGameLog = latest;
    gameLogSize = fs.existsSync(latest) ? fs.statSync(latest).size : 0;
  }

  if (!activeGameLog || !fs.existsSync(activeGameLog)) return;
  const stat = fs.statSync(activeGameLog);
  if (stat.size > gameLogSize) {
    const stream = fs.createReadStream(activeGameLog, {
      start: gameLogSize,
      end: stat.size,
      encoding: 'utf8'
    });
    let buffer = '';
    stream.on('data', chunk => { buffer += chunk; });
    stream.on('end', () => {
      gameLogSize = stat.size;
      const lines = buffer.split(/\r?\n/);
      for (const line of lines) {
        // Jumping from Kisogo to Urlen
        const jumpMatch = line.match(/Jumping from\s+([A-Za-z0-9\-\s]+?)\s+to\s+([A-Za-z0-9\-]+)/i);
        if (jumpMatch) {
          handleSystemTransition(jumpMatch[2], jumpMatch[1].trim());
        }
        // Undocking
        const undockMatch = line.match(/Undocking from .+ to ([A-Za-z0-9\-]+) solar system/i);
        if (undockMatch) {
          handleSystemTransition(undockMatch[1]);
        }
      }
    });
  }
}, 1000);

// Background Windows OS Clipboard Listener
// Allows hands-free scanning: when you press Ctrl+C in EVE, this reads it from the OS without tabbing out!
let lastSeenClipboard = '';
let isCheckingClip = false;

setInterval(() => {
  if (isCheckingClip) return;
  isCheckingClip = true;

  exec('powershell.exe -NoProfile -Command "Get-Clipboard"', { timeout: 3000 }, (err, stdout) => {
    isCheckingClip = false;
    if (err || !stdout) return;

    const text = stdout.trim();
    if (text && text !== lastSeenClipboard && text.length > 5) {
      lastSeenClipboard = text;
      console.log(`\n📋 [OS CLIPBOARD DETECTED] Read from game client without tabbing out!`);
      console.log(`   Preview: ${text.replace(/\r?\n/g, ' ').slice(0, 75)}...`);
      broadcastUpdate('CLIPBOARD_TEXT', { text });
    }
  });
}, 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🗺️  SYND.NET MULTI-USER CHAIN MAPPER & SYNC SERVER');
  console.log('====================================================');
  console.log(`Running on port ${PORT}`);
  console.log(`Share this with your buddy: http://192.168.10.74:3000`);
});
