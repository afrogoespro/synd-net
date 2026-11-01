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

// Global Shared Chain State seeded with initial Pathfinder/Tripwire chain
const INITIAL_SYSTEMS = {
  'Jita': { id: 'Jita', name: 'Jita', systemClass: 'Highsec', security: 0.9, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 650, y: 40 },
  'Ikuchi': { id: 'Ikuchi', name: 'Ikuchi', systemClass: 'Highsec', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 130 },
  'Ansila': { id: 'Ansila', name: 'Ansila', systemClass: 'Highsec', security: 0.9, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 220 },
  'Hykkota': { id: 'Hykkota', name: 'Hykkota', systemClass: 'Highsec', security: 0.8, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 310 },
  'J151141': { id: 'J151141', name: 'J151141', systemClass: 'C1', sigCode: 'YSO', statics: ['Highsec'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 180, y: 400 },
  'Muvolailen': { id: 'Muvolailen', name: 'Muvolailen', systemClass: 'Highsec', security: 0.7, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 330, y: 130 },
  'Sobaseki': { id: 'Sobaseki', name: 'Sobaseki', systemClass: 'Highsec', security: 0.8, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 470, y: 130 },
  'Isanamo': { id: 'Isanamo', name: 'Isanamo', systemClass: 'Highsec', security: 0.6, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 470, y: 220 },
  'Uemisaisen': { id: 'Uemisaisen', name: 'Uemisaisen', systemClass: 'Highsec', security: 0.6, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 470, y: 310 },
  'J103955': { id: 'J103955', name: 'J103955', systemClass: 'C3', sigCode: 'JVC', statics: ['Lowsec'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 410, y: 400 },
  'J142349': { id: 'J142349', name: 'J142349', systemClass: 'C5', sigCode: 'JPV', statics: ['C3'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 410, y: 490 },
  'New Caldari': { id: 'New Caldari', name: 'New Caldari', systemClass: 'Highsec', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 130 },
  'Alikara': { id: 'Alikara', name: 'Alikara', systemClass: 'Highsec', security: 0.7, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 220 },
  'J101817': { id: 'J101817', name: 'J101817', systemClass: 'C1', sigCode: 'ISA', statics: ['Highsec'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 880, y: 220 },
  'J204842': { id: 'J204842', name: 'J204842', systemClass: 'C3', sigCode: 'XSX', statics: ['Lowsec'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 310 },
  'J123947': { id: 'J123947', name: 'J123947', systemClass: 'C4', sigCode: 'RCO', statics: ['C3', 'C4'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 620, y: 400 },
  'J155214': { id: 'J155214', name: 'J155214', systemClass: 'C4', sigCode: 'MFD', statics: ['C3', 'C2'], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 790, y: 400 },
  'Atlar': { id: 'Atlar', name: 'Atlar', systemClass: 'Lowsec', security: 0.4, sigCode: 'UCY', statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 740, y: 490 },
  'Perimeter': { id: 'Perimeter', name: 'Perimeter', systemClass: 'Highsec', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 990, y: 130 },
  'Niyabainen': { id: 'Niyabainen', name: 'Niyabainen', systemClass: 'Highsec', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 990, y: 220 },
  'Maurasi': { id: 'Maurasi', name: 'Maurasi', systemClass: 'Highsec', security: 0.9, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 1120, y: 130 },
  'Urlen': { id: 'Urlen', name: 'Urlen', systemClass: 'Highsec', security: 1.0, statics: [], structures: [], activePilots: [], signatures: [], lastUpdated: '13:30', x: 1120, y: 220 }
};

const INITIAL_CONNECTIONS = [
  { id: 'c-jita-ikuchi', from: 'Jita', to: 'Ikuchi', wormholeType: 'Stargate' },
  { id: 'c-ikuchi-ansila', from: 'Ikuchi', to: 'Ansila', wormholeType: 'Stargate' },
  { id: 'c-ansila-hykkota', from: 'Ansila', to: 'Hykkota', wormholeType: 'Stargate' },
  { id: 'c-hykkota-j151141', from: 'Hykkota', to: 'J151141', wormholeType: 'Wormhole', sigFrom: 'YSO' },
  { id: 'c-jita-muvolailen', from: 'Jita', to: 'Muvolailen', wormholeType: 'Stargate' },
  { id: 'c-jita-sobaseki', from: 'Jita', to: 'Sobaseki', wormholeType: 'Stargate' },
  { id: 'c-sobaseki-isanamo', from: 'Sobaseki', to: 'Isanamo', wormholeType: 'Stargate' },
  { id: 'c-isanamo-uemisaisen', from: 'Isanamo', to: 'Uemisaisen', wormholeType: 'Stargate' },
  { id: 'c-uemisaisen-j103955', from: 'Uemisaisen', to: 'J103955', wormholeType: 'Wormhole', sigFrom: 'ANF' },
  { id: 'c-j103955-j142349', from: 'J103955', to: 'J142349', wormholeType: 'Wormhole', sigFrom: 'JPV' },
  { id: 'c-jita-newcaldari', from: 'Jita', to: 'New Caldari', wormholeType: 'Stargate' },
  { id: 'c-newcaldari-alikara', from: 'New Caldari', to: 'Alikara', wormholeType: 'Stargate' },
  { id: 'c-alikara-j101817', from: 'Alikara', to: 'J101817', wormholeType: 'Wormhole', sigFrom: 'ISA' },
  { id: 'c-alikara-j204842', from: 'Alikara', to: 'J204842', wormholeType: 'Wormhole', sigFrom: 'HMV' },
  { id: 'c-j204842-j123947', from: 'J204842', to: 'J123947', wormholeType: 'Wormhole', sigFrom: 'RCO' },
  { id: 'c-j204842-j155214', from: 'J204842', to: 'J155214', wormholeType: 'Wormhole', sigFrom: 'MFD' },
  { id: 'c-j204842-atlar', from: 'J204842', to: 'Atlar', wormholeType: 'Wormhole', sigFrom: 'UCY' },
  { id: 'c-jita-perimeter', from: 'Jita', to: 'Perimeter', wormholeType: 'Stargate' },
  { id: 'c-perimeter-niyabainen', from: 'Perimeter', to: 'Niyabainen', wormholeType: 'Stargate' },
  { id: 'c-jita-maurasi', from: 'Jita', to: 'Maurasi', wormholeType: 'Stargate' },
  { id: 'c-maurasi-urlen', from: 'Maurasi', to: 'Urlen', wormholeType: 'Stargate' }
];

let chainMap = {
  systems: { ...INITIAL_SYSTEMS },
  connections: [ ...INITIAL_CONNECTIONS ],
  onlineBuddies: []
};

const stateFilePath = path.join(__dirname, 'chainState.json');

function saveState() {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(chainMap, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save chainState.json', e);
  }
}

function loadState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      if (data && data.systems) {
        chainMap = data;
        console.log(`[Persistence] Restored saved chain state with ${Object.keys(chainMap.systems).length} systems!`);
      }
    }
  } catch (e) {
    console.warn('[Persistence] Could not load saved state, using defaults', e);
  }
}

// Load saved state on boot
loadState();

let lastActiveSystem = 'J103955';

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
          saveState();
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

  // Update wormhole connection signature, type, mass status, time status
  if (req.url === '/api/map/connection/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        const { connectionId, from, to, sigFrom, sigTo, wormholeType, massStatus, timeStatus } = update;

        let conn = null;
        if (connectionId) {
          conn = chainMap.connections.find(c => c.id === connectionId);
        }
        if (!conn && from && to) {
          conn = chainMap.connections.find(
            c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
          );
        }

        if (!conn && from && to) {
          conn = {
            id: `conn-${Date.now()}`,
            from,
            to,
            wormholeType: wormholeType || 'Wormhole',
            massStatus: massStatus || 'stable',
            timeStatus: timeStatus || 'stable'
          };
          chainMap.connections.push(conn);
        }

        if (conn) {
          if (sigFrom !== undefined) conn.sigFrom = sigFrom.trim().toUpperCase();
          if (sigTo !== undefined) conn.sigTo = sigTo.trim().toUpperCase();
          if (wormholeType !== undefined) conn.wormholeType = wormholeType.trim();
          if (massStatus !== undefined) conn.massStatus = massStatus;
          if (timeStatus !== undefined) conn.timeStatus = timeStatus;

          // If toSystem exists, update its displayed sigCode
          if (to && chainMap.systems[to] && sigFrom) {
            chainMap.systems[to].sigCode = sigFrom.trim().toUpperCase();
          }
        }

        saveState();
        broadcastUpdate('MAP_UPDATE', chainMap);
        console.log(`[Connection Updated] ${from} <-> ${to} | Sig: [${conn ? conn.sigFrom : ''}] | Mass: ${conn ? conn.massStatus : ''} | Time: ${conn ? conn.timeStatus : ''}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, connection: conn, chainMap }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Update pilot location (e.g. buddy sets their location or moves)
  if (req.url === '/api/map/pilot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { pilotName, systemName } = JSON.parse(body);
        if (!pilotName || !systemName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'pilotName and systemName are required' }));
          return;
        }

        const cleanSys = systemName.trim();
        // Remove pilot from all systems first
        Object.values(chainMap.systems).forEach(sys => {
          sys.activePilots = (sys.activePilots || []).filter(p => !p.startsWith(pilotName));
        });

        // Ensure system exists
        if (!chainMap.systems[cleanSys]) {
          chainMap.systems[cleanSys] = {
            id: cleanSys,
            name: cleanSys,
            systemClass: cleanSys.startsWith('J') ? 'C2' : 'Highsec',
            statics: [],
            structures: [],
            activePilots: [pilotName],
            signatures: [],
            lastUpdated: new Date().toLocaleTimeString()
          };
        } else {
          chainMap.systems[cleanSys].activePilots = chainMap.systems[cleanSys].activePilots || [];
          if (!chainMap.systems[cleanSys].activePilots.includes(pilotName)) {
            chainMap.systems[cleanSys].activePilots.push(pilotName);
          }
        }

        // Add to online buddies list if not present
        if (!chainMap.onlineBuddies.includes(pilotName)) {
          chainMap.onlineBuddies.push(pilotName);
        }

        broadcastUpdate('MAP_UPDATE', chainMap);
        console.log(`[Pilot Location Updated] ${pilotName} -> ${cleanSys}`);
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

function detectHostCharacterName() {
  if (!eveLogsBase) return null;
  const gameDir = path.join(eveLogsBase, 'Gamelogs');
  if (!fs.existsSync(gameDir)) return null;
  const files = fs.readdirSync(gameDir).filter(f => f.endsWith('.txt')).map(f => {
    const full = path.join(gameDir, f);
    return { file: full, mtime: fs.statSync(full).mtime.getTime() };
  }).sort((a, b) => b.mtime - a.mtime);
  if (files.length === 0) return null;
  try {
    const content = fs.readFileSync(files[0].file, 'utf8');
    const m = content.match(/Listener:\s*([^\r\n]+)/);
    if (m && m[1].trim()) return m[1].trim();
  } catch (e) {}
  return null;
}

const hostPilotName = detectHostCharacterName();
console.log(`[Host Character Identified] Flying as: ${hostPilotName || 'Awaiting Pilot Sign In'}`);

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

  // Remove host pilot from other systems so marker stays only on current system
  Object.values(chainMap.systems).forEach(sys => {
    sys.activePilots = (sys.activePilots || []).filter(p => !p.includes(hostPilotName));
  });

  const hostTag = `${hostPilotName}`;
  if (!chainMap.systems[newSys]) {
    chainMap.systems[newSys] = {
      id: newSys,
      name: newSys,
      systemClass: whClass,
      statics: whClass === 'C2' ? ['C2', 'Highsec'] : whClass === 'C3' ? ['Lowsec'] : [],
      structures: [],
      activePilots: [hostTag],
      signatures: [],
      lastUpdated: new Date().toLocaleTimeString()
    };
  } else {
    chainMap.systems[newSys].activePilots = chainMap.systems[newSys].activePilots || [];
    if (!chainMap.systems[newSys].activePilots.includes(hostTag)) {
      chainMap.systems[newSys].activePilots.push(hostTag);
    }
    chainMap.systems[newSys].lastUpdated = new Date().toLocaleTimeString();
  }

  // Connect previous system to new system
  let isWormhole = newSys.startsWith('J') || (previous && previous.startsWith('J'));
  if (previous && previous !== newSys) {
    const connExists = chainMap.connections.some(
      c => (c.from === previous && c.to === newSys) || (c.from === newSys && c.to === previous)
    );
    if (!connExists) {
      chainMap.connections.push({
        id: `conn-${Date.now()}`,
        from: previous,
        to: newSys,
        wormholeType: isWormhole ? 'Wormhole' : 'Stargate',
        massStatus: 'stable',
        timeStatus: 'stable'
      });
    }
  }

  saveState();

  broadcastUpdate('MAP_UPDATE', chainMap);
  broadcastUpdate('JUMP', { 
    systemName: newSys, 
    fromSystem: previous,
    isWormhole: isWormhole
  });
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
