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

function getEveTimeString() {
  return new Date().toISOString().slice(11, 16);
}

// Connected SSE clients (browsers of you and your buddy)
let sseClients = [];

// Send periodic SSE keep-alive ping every 15s to keep Cloudflare tunnels alive indefinitely
setInterval(() => {
  sseClients.forEach(res => {
    try {
      res.write(': ping\n\n');
    } catch (e) {}
  });
}, 15000);

function broadcastUpdate(type, payload) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  sseClients.forEach(res => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (e) {}
  });
}

// Intelligent collision-free coordinate resolver for newly discovered chain systems
function getFreeNodePosition(previousSysId) {
  const existingNodes = Object.values(chainMap.systems).filter(s => typeof s.x === 'number' && typeof s.y === 'number');
  if (existingNodes.length === 0) return { x: 578, y: 160 };

  const prevNode = previousSysId && chainMap.systems[previousSysId];
  let candidateX = 578;
  let candidateY = 160;

  if (prevNode && typeof prevNode.x === 'number' && typeof prevNode.y === 'number') {
    candidateY = prevNode.y + 110;
    // Find all siblings already connected to prevNode
    const siblings = chainMap.connections
      .filter(c => c.from === previousSysId || c.to === previousSysId)
      .map(c => c.from === previousSysId ? c.to : c.from)
      .filter(id => id !== previousSysId && chainMap.systems[id] && typeof chainMap.systems[id].x === 'number');

    if (siblings.length > 0) {
      const maxX = Math.max(...siblings.map(id => chainMap.systems[id].x));
      candidateX = maxX + 180;
    } else {
      candidateX = prevNode.x;
    }
  } else {
    const maxX = Math.max(...existingNodes.map(s => s.x));
    candidateX = maxX + 180;
    candidateY = 160;
  }

  // Prevent overlap with ANY existing node
  let attempts = 0;
  while (attempts < 40) {
    const hit = existingNodes.some(s => Math.abs(s.x - candidateX) < 165 && Math.abs(s.y - candidateY) < 85);
    if (!hit) break;
    candidateX += 180;
    attempts++;
  }

  return { x: candidateX, y: candidateY };
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
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
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

        // Full chainMap layout / position sync
        if (update.positions && typeof update.positions === 'object') {
          Object.entries(update.positions).forEach(([sysId, pos]) => {
            if (chainMap.systems[sysId] && typeof pos.x === 'number' && typeof pos.y === 'number') {
              chainMap.systems[sysId].x = Math.round(pos.x);
              chainMap.systems[sysId].y = Math.round(pos.y);
            }
          });
          saveState();
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[Shared Map] Updated positions for ${Object.keys(update.positions).length} systems`);
        } else if (update.chainMap && update.chainMap.systems) {
          Object.entries(update.chainMap.systems).forEach(([sysId, sysData]) => {
            if (chainMap.systems[sysId]) {
              if (typeof sysData.x === 'number') chainMap.systems[sysId].x = Math.round(sysData.x);
              if (typeof sysData.y === 'number') chainMap.systems[sysId].y = Math.round(sysData.y);
              if (sysData.isCollapsed !== undefined) {
                chainMap.systems[sysId].isCollapsed = sysData.isCollapsed;
              }
            }
          });
          saveState();
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[Shared Map] Synchronized tree positions across ${Object.keys(update.chainMap.systems).length} systems`);
        }

        // Single System update
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
                  timestamp: getEveTimeString()
                });
              }
            });
            existing.structures = currentStructs;
          }

          // Merge signatures
          if (update.signatures && Array.isArray(update.signatures)) {
            existing.signatures = update.signatures;
          }

          existing.lastUpdated = getEveTimeString();
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
        let { connectionId, from, to, sigFrom, sigTo, wormholeType, massStatus, timeStatus, tactical, isFrig } = update;

        // Resolve case-insensitive system names from current chainMap
        const fromKey = from ? (Object.keys(chainMap.systems).find(k => k.toLowerCase() === from.trim().toLowerCase()) || from.trim()) : from;
        const toKey = to ? (Object.keys(chainMap.systems).find(k => k.toLowerCase() === to.trim().toLowerCase()) || to.trim()) : to;
        from = fromKey;
        to = toKey;

        let conn = null;
        if (connectionId) {
          conn = chainMap.connections.find(c => c.id === connectionId);
        }
        if (!conn && from && to) {
          conn = chainMap.connections.find(
            c => (c.from.toLowerCase() === from.toLowerCase() && c.to.toLowerCase() === to.toLowerCase()) || 
                 (c.from.toLowerCase() === to.toLowerCase() && c.to.toLowerCase() === from.toLowerCase())
          );
        }

        if (!conn && from && to) {
          const isWh = from.startsWith('J') || to.startsWith('J');
          conn = {
            id: `conn-${Date.now()}`,
            from,
            to,
            wormholeType: wormholeType || (isWh ? 'Wormhole' : 'Stargate'),
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
          if (tactical !== undefined) conn.tactical = tactical;
          if (isFrig !== undefined) conn.isFrig = isFrig;

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

  // Wireless Clipboard Sharing between pilots
  if (req.url === '/api/map/clipboard' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { text, pilotName } = JSON.parse(body);
        if (text && typeof text === 'string') {
          const cleanText = text.trim();
          lastSeenClipboard = cleanText;
          console.log(`\n📋 [WIRELESS CLIPBOARD] Shared by ${pilotName || 'Pilot'}: ${cleanText.replace(/\r?\n/g, ' ').slice(0, 60)}...`);
          broadcastUpdate('CLIPBOARD_TEXT', { text: cleanText, pilot: pilotName || 'Buddy' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      } catch (err) {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid clipboard payload' }));
    });
    return;
  }

  // Delete a specific wormhole / stargate connection
  if (req.url === '/api/map/connection/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { connectionId, from, to } = JSON.parse(body);
        const beforeLen = chainMap.connections.length;
        if (connectionId) {
          chainMap.connections = chainMap.connections.filter(c => c.id !== connectionId);
        } else if (from && to) {
          chainMap.connections = chainMap.connections.filter(
            c => !((c.from === from && c.to === to) || (c.from === to && c.to === from))
          );
        }
        saveState();
        broadcastUpdate('MAP_UPDATE', chainMap);
        console.log(`[Connection Deleted] Removed connection ${connectionId || (from + ' <-> ' + to)} (${beforeLen} -> ${chainMap.connections.length})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, chainMap }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Get or set shared EVE SSO Client ID across all fleet members
  if (req.url === '/api/auth/config') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        clientId: chainMap.eveClientId || process.env.VITE_EVE_CLIENT_ID || ''
      }));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { clientId } = JSON.parse(body);
          chainMap.eveClientId = (clientId || '').trim();
          saveState();
          console.log(`[SSO Config] Saved shared CCP Client ID: ${chainMap.eveClientId ? chainMap.eveClientId.slice(0, 8) + '...' : 'none'}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, clientId: chainMap.eveClientId }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Update signatures/anomalies for a system
  if (req.url === '/api/map/signatures' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { systemId, signatures } = JSON.parse(body);
        const cleanSys = (systemId || '').trim();
        if (cleanSys && chainMap.systems[cleanSys]) {
          chainMap.systems[cleanSys].signatures = signatures || [];
          chainMap.systems[cleanSys].lastUpdated = getEveTimeString();
          saveState();
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[Signatures Updated] ${cleanSys} now has ${signatures.length} signatures/anomalies`);
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

  // Add or update structure timer
  if (req.url === '/api/map/timer/add' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const timer = JSON.parse(body);
        if (!chainMap.timers) chainMap.timers = [];
        chainMap.timers = [timer, ...chainMap.timers.filter(t => t.id !== timer.id)];
        saveState();
        broadcastUpdate('MAP_UPDATE', chainMap);
        console.log(`[Timer Added] ${timer.structureType} in ${timer.systemName} | ${timer.timerType} vulnerable at ${timer.vulnerableTime}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, timers: chainMap.timers }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Delete structure timer
  if (req.url === '/api/map/timer/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { timerId } = JSON.parse(body);
        if (chainMap.timers) {
          chainMap.timers = chainMap.timers.filter(t => t.id !== timerId);
          saveState();
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[Timer Deleted] ID: ${timerId}`);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, timers: chainMap.timers || [] }));
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
        const { pilotName, systemName, fromSystem } = JSON.parse(body);
        if (!pilotName || !systemName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'pilotName and systemName are required' }));
          return;
        }

        const cleanSys = systemName.trim();
        // Track previous system for this pilot
        let previousSys = (fromSystem || '').trim() || pilotLastSystem.get(pilotName) || null;
        Object.entries(chainMap.systems).forEach(([sysId, sys]) => {
          if (!previousSys && (sys.activePilots || []).some(p => p.startsWith(pilotName))) {
            previousSys = sysId;
          }
          sys.activePilots = (sys.activePilots || []).filter(p => !p.startsWith(pilotName));
        });

        // Classify system (Wormhole C1-C6, Highsec, Lowsec, Nullsec)
        let whClass = 'Highsec';
        if (cleanSys.startsWith('J')) {
          const num = parseInt(cleanSys.replace(/\D/g, ''), 10) || 0;
          if (num >= 100000 && num <= 119999) whClass = 'C1';
          else if (num >= 120000 && num <= 139999) whClass = 'C2';
          else if (num >= 140000 && num <= 159999) whClass = 'C3';
          else if (num >= 160000 && num <= 179999) whClass = 'C4';
          else if (num >= 180000 && num <= 199999) whClass = 'C5';
          else if (num >= 200000 && num <= 219999) whClass = 'C6';
          else whClass = 'C2';
        }

        // Determine smart collision-free coordinates
        const { x: newX, y: newY } = getFreeNodePosition(previousSys);

        // Ensure system exists with proper coordinates
        if (!chainMap.systems[cleanSys]) {
          chainMap.systems[cleanSys] = {
            id: cleanSys,
            name: cleanSys,
            systemClass: whClass,
            statics: whClass === 'C2' ? ['C2', 'Highsec'] : whClass === 'C3' ? ['Lowsec'] : [],
            structures: [],
            activePilots: [pilotName],
            signatures: [],
            lastUpdated: getEveTimeString(),
            x: newX,
            y: newY
          };
        } else {
          if (chainMap.systems[cleanSys].x === undefined) chainMap.systems[cleanSys].x = newX;
          if (chainMap.systems[cleanSys].y === undefined) chainMap.systems[cleanSys].y = newY;
          chainMap.systems[cleanSys].activePilots = chainMap.systems[cleanSys].activePilots || [];
          if (!chainMap.systems[cleanSys].activePilots.includes(pilotName)) {
            chainMap.systems[cleanSys].activePilots.push(pilotName);
          }
          chainMap.systems[cleanSys].lastUpdated = getEveTimeString();
        }

        // Connect previous system to new system
        if (previousSys && previousSys !== cleanSys) {
          const connExists = chainMap.connections.some(
            c => (c.from === previousSys && c.to === cleanSys) || (c.from === cleanSys && c.to === previousSys)
          );
          if (!connExists) {
            const isWh = cleanSys.startsWith('J') || previousSys.startsWith('J');
            chainMap.connections.push({
              id: `conn-${Date.now()}`,
              from: previousSys,
              to: cleanSys,
              wormholeType: isWh ? 'Wormhole' : 'Stargate',
              massStatus: 'stable',
              timeStatus: 'stable'
            });
          }
        }

        // Add to online buddies list if not present
        if (!chainMap.onlineBuddies.includes(pilotName)) {
          chainMap.onlineBuddies.push(pilotName);
        }

        pilotLastSystem.set(pilotName, cleanSys);

        saveState();
        broadcastUpdate('MAP_UPDATE', chainMap);
        broadcastUpdate('JUMP', { 
          systemName: cleanSys, 
          fromSystem: previousSys, 
          pilot: pilotName 
        });
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

  // Delete a system and its connections
  if (req.url === '/api/map/system/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { systemId } = JSON.parse(body);
        const cleanSys = (systemId || '').trim();
        if (cleanSys && chainMap.systems[cleanSys]) {
          delete chainMap.systems[cleanSys];
          chainMap.connections = chainMap.connections.filter(
            c => c.from !== cleanSys && c.to !== cleanSys
          );
          saveState();
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[System Deleted] Removed ${cleanSys} and all associated connections`);
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

  // Mass delete multiple systems and all their connections
  if (req.url === '/api/map/systems/delete-batch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { systemIds } = JSON.parse(body);
        if (Array.isArray(systemIds) && systemIds.length > 0) {
          const deleteSet = new Set(systemIds.map(s => String(s).trim()));
          deleteSet.forEach(cleanSys => {
            if (chainMap.systems[cleanSys]) {
              delete chainMap.systems[cleanSys];
            }
          });
          chainMap.connections = chainMap.connections.filter(
            c => !deleteSet.has(c.from) && !deleteSet.has(c.to)
          );
          saveState();
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[Batch Systems Deleted] Removed ${deleteSet.size} systems and their connections`);
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

  // Toggle branch collapse state
  if (req.url === '/api/map/system/collapse' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { systemId } = JSON.parse(body);
        const cleanSys = (systemId || '').trim();
        if (cleanSys && chainMap.systems[cleanSys]) {
          chainMap.systems[cleanSys].isCollapsed = !chainMap.systems[cleanSys].isCollapsed;
          saveState();
          broadcastUpdate('MAP_UPDATE', chainMap);
          console.log(`[System Collapse Toggled] ${cleanSys} isCollapsed = ${chainMap.systems[cleanSys].isCollapsed}`);
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

  // Prune disconnected / dead-end systems
  if (req.url === '/api/map/prune' && req.method === 'POST') {
    try {
      // Find systems with no connections and no active pilots
      const toDelete = [];
      Object.keys(chainMap.systems).forEach(sysId => {
        if (sysId === 'Jita' || sysId === 'J103955') return;
        const hasConn = chainMap.connections.some(c => c.from === sysId || c.to === sysId);
        const hasPilots = (chainMap.systems[sysId].activePilots || []).length > 0;
        if (!hasConn && !hasPilots) {
          toDelete.push(sysId);
        }
      });

      toDelete.forEach(sysId => {
        delete chainMap.systems[sysId];
      });

      saveState();
      broadcastUpdate('MAP_UPDATE', chainMap);
      console.log(`[Map Pruned] Removed ${toDelete.length} disconnected systems`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, prunedCount: toDelete.length, chainMap }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // === CORP BUYBACK PROGRAM TICKETS API ===
  // GET /api/buyback/tickets - Fetch all tickets
  if (req.url === '/api/buyback/tickets' && req.method === 'GET') {
    const ticketsFile = path.join(__dirname, 'buybackTickets.json');
    let tickets = [];
    try {
      if (fs.existsSync(ticketsFile)) {
        tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
      }
    } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tickets));
    return;
  }

  // POST /api/buyback/tickets/create - Submit a new buyback ticket
  if (req.url === '/api/buyback/tickets/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const ticketsFile = path.join(__dirname, 'buybackTickets.json');
        let tickets = [];
        try {
          if (fs.existsSync(ticketsFile)) {
            tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
          }
        } catch (e) {}

        const newTicket = {
          id: `BB-${Date.now().toString(36).toUpperCase()}`,
          pilotName: payload.pilotName || 'Anonymous Capsuleer',
          systemName: payload.systemName || 'J121452',
          stationOrStructure: payload.stationOrStructure || 'Caldari Control Tower / Upwell Structure',
          submittedAt: new Date().toISOString(),
          status: 'pending', // 'pending' | 'accepted' | 'paid' | 'rejected'
          items: payload.items || [],
          totalJitaValue: payload.totalJitaValue || 0,
          totalBuybackValue: payload.totalBuybackValue || 0, // -10% of Jita
          discountPercent: payload.discountPercent !== undefined ? payload.discountPercent : 10,
          totalVolumeM3: payload.totalVolumeM3 || 0,
          contractNote: payload.contractNote || '',
          payoutTxHash: payload.payoutTxHash || null
        };

        tickets.unshift(newTicket);
        fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));

        console.log(`\n📦 [BUYBACK TICKET SUBMITTED] ${newTicket.id} by ${newTicket.pilotName}: ${newTicket.totalBuybackValue.toLocaleString()} ISK (-10% Jita)`);
        broadcastUpdate('BUYBACK_TICKET_NEW', newTicket);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ticket: newTicket }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/buyback/tickets/status - Update ticket status (e.g. accepted, paid, rejected)
  if (req.url === '/api/buyback/tickets/status' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { ticketId, status, notes } = JSON.parse(body);
        const ticketsFile = path.join(__dirname, 'buybackTickets.json');
        let tickets = [];
        if (fs.existsSync(ticketsFile)) {
          tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
        }

        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          ticket.status = status;
          if (notes) ticket.managerNotes = notes;
          ticket.updatedAt = new Date().toISOString();
          fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));
          broadcastUpdate('BUYBACK_TICKET_UPDATE', ticket);
          console.log(`[BUYBACK TICKET STATUS] ${ticketId} -> ${status}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ticket }));
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
          lastUpdated: getEveTimeString()
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

function normalizePilot(pilot) {
  if (!pilot) return 'Fleet Scout';
  const p = pilot.trim();
  if (p.toLowerCase().includes('ennis') || p.toLowerCase().includes('hauler')) {
    return 'USS Hauler';
  }
  if (p.toLowerCase().includes('syndra')) {
    return 'Syndra en Tilavine';
  }
  return p;
}

function isMatchingPilot(entry, target) {
  const e = (entry || '').toLowerCase();
  const t = (target || '').toLowerCase();
  if (e === t) return true;
  if ((e.includes('ennis') || e.includes('hauler')) && (t.includes('ennis') || t.includes('hauler'))) return true;
  if (e.includes('syndra') && t.includes('syndra')) return true;
  return false;
}

let hostPilotName = normalizePilot(detectHostCharacterName());
console.log(`[Host Character Identified] Flying as: ${hostPilotName || 'Awaiting Pilot Sign In'}`);

const pilotLastSystem = new Map(); // pilotName -> lastSystemName
let isBootSweep = true;

function handleSystemTransition(newSys, fromSys, customPilot) {
  if (!newSys) return;
  newSys = newSys.trim();

  const activePilot = normalizePilot(customPilot || hostPilotName || 'Fleet Scout');
  
  // Find pilot's previous system from memory or existing map
  let lastSysForPilot = pilotLastSystem.get(activePilot);
  if (!lastSysForPilot) {
    for (const [sysId, sysObj] of Object.entries(chainMap.systems)) {
      if ((sysObj.activePilots || []).some(p => isMatchingPilot(p, activePilot))) {
        lastSysForPilot = sysId;
        break;
      }
    }
  }

  if (newSys === lastSysForPilot) return;
  pilotLastSystem.set(activePilot, newSys);

  const previous = fromSys || lastSysForPilot;
  console.log(`\n🚀 [EVE LOCATION FOLLOWER] Character jump detected: ${activePilot} in ${previous || 'Space'} ➔ ${newSys}`);

  // Classify system (Wormhole C1-C6, Highsec, Lowsec, Nullsec)
  let whClass = 'Highsec';
  if (newSys.startsWith('J')) {
    const num = parseInt(newSys.replace(/\D/g, ''), 10) || 0;
    if (num >= 100000 && num <= 119999) whClass = 'C1';
    else if (num >= 120000 && num <= 139999) whClass = 'C2';
    else if (num >= 140000 && num <= 159999) whClass = 'C3';
    else if (num >= 160000 && num <= 179999) whClass = 'C4';
    else if (num >= 180000 && num <= 199999) whClass = 'C5';
    else if (num >= 200000 && num <= 219999) whClass = 'C6';
    else whClass = 'C2';
  }

  // Remove this pilot from other systems so marker stays only on current system
  Object.values(chainMap.systems).forEach(sys => {
    sys.activePilots = (sys.activePilots || []).filter(p => !isMatchingPilot(p, activePilot));
  });

  const hostTag = activePilot;
  const { x: newX, y: newY } = getFreeNodePosition(previous);

  if (!chainMap.systems[newSys]) {
    chainMap.systems[newSys] = {
      id: newSys,
      name: newSys,
      systemClass: whClass,
      statics: whClass.startsWith('C') ? [whClass, 'Highsec'] : [],
      structures: [],
      activePilots: [hostTag],
      signatures: [],
      lastUpdated: getEveTimeString(),
      x: newX,
      y: newY
    };
  } else {
    if (chainMap.systems[newSys].x === undefined) chainMap.systems[newSys].x = newX;
    if (chainMap.systems[newSys].y === undefined) chainMap.systems[newSys].y = newY;
    chainMap.systems[newSys].activePilots = chainMap.systems[newSys].activePilots || [];
    if (!chainMap.systems[newSys].activePilots.some(p => isMatchingPilot(p, hostTag))) {
      chainMap.systems[newSys].activePilots.push(hostTag);
    }
    chainMap.systems[newSys].lastUpdated = getEveTimeString();
  }

  // Connect previous system to new system
  const isWormhole = newSys.startsWith('J') || (previous && previous.startsWith('J'));
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

  if (!isBootSweep) {
    broadcastUpdate('MAP_UPDATE', chainMap);
    broadcastUpdate('JUMP', { 
      pilot: activePilot,
      systemName: newSys, 
      fromSystem: previous,
      isWormhole: isWormhole
    });
  }
}

// 1. Multi-File Tailer for Local Chatlogs (Fires instantly on EVERY wormhole & gate jump)
const trackedChatFiles = new Map(); // filePath -> lastReadByteOffset

function getChatListener(filePath) {
  try {
    const head = fs.readFileSync(filePath, { encoding: 'utf16le' }).slice(0, 600);
    const m = head.match(/Listener:\s*([^\r\n]+)/i);
    if (m && m[1].trim()) return m[1].trim();
  } catch (e) {}
  return null;
}

function pollActiveChatlogs() {
  if (!eveLogsBase) return;
  const chatDir = path.join(eveLogsBase, 'Chatlogs');
  if (!fs.existsSync(chatDir)) return;

  const now = Date.now();
  let files = [];
  try {
    files = fs.readdirSync(chatDir)
      .filter(f => f.startsWith('Local_') && f.endsWith('.txt'))
      .map(f => {
        const full = path.join(chatDir, f);
        try {
          return { file: full, mtime: fs.statSync(full).mtime.getTime() };
        } catch { return null; }
      })
      .filter(f => f && (now - f.mtime) < 4 * 60 * 60 * 1000)
      .sort((a, b) => a.mtime - b.mtime);
  } catch (e) {
    return;
  }

  for (const { file } of files) {
    try {
      const stat = fs.statSync(file);
      if (!trackedChatFiles.has(file)) {
        trackedChatFiles.set(file, stat.size);
      }

      let prevSize = trackedChatFiles.get(file);
      if (stat.size < prevSize) {
        prevSize = 0;
      }
      if (stat.size > prevSize) {
        trackedChatFiles.set(file, stat.size);
        const readLen = stat.size - prevSize;
        const buf = Buffer.alloc(readLen);
        const fd = fs.openSync(file, 'r');
        fs.readSync(fd, buf, 0, buf.length, prevSize);
        fs.closeSync(fd);

        const text = buf.toString('utf16le');
        const matches = [...text.matchAll(/Channel changed to Local\s*:\s*([^\r\n]+)/gi)];
        if (matches.length > 0) {
          const listener = getChatListener(file);
          for (const m of matches) {
            const cleanSys = m[1].replace(/<[^>]+>/g, '').trim();
            if (cleanSys) {
              handleSystemTransition(cleanSys, null, listener);
            }
          }
        }
      }
    } catch (e) {}
  }
}

// 2. Multi-File Tailer for Gamelogs (Catches gate jumps, undocks, and jump tunnels)
const trackedGameFiles = new Map();

function getGamelogListener(filePath) {
  try {
    const head = fs.readFileSync(filePath, { encoding: 'utf8' }).slice(0, 600);
    const m = head.match(/Listener:\s*([^\r\n]+)/i);
    if (m && m[1].trim()) return m[1].trim();
  } catch (e) {}
  return null;
}

function pollActiveGamelogs() {
  if (!eveLogsBase) return;
  const gameDir = path.join(eveLogsBase, 'Gamelogs');
  if (!fs.existsSync(gameDir)) return;

  const now = Date.now();
  let files = [];
  try {
    files = fs.readdirSync(gameDir)
      .filter(f => f.endsWith('.txt'))
      .map(f => {
        const full = path.join(gameDir, f);
        try {
          return { file: full, mtime: fs.statSync(full).mtime.getTime() };
        } catch { return null; }
      })
      .filter(f => f && (now - f.mtime) < 4 * 60 * 60 * 1000)
      .sort((a, b) => a.mtime - b.mtime);
  } catch (e) {
    return;
  }

  for (const { file } of files) {
    try {
      const stat = fs.statSync(file);
      if (!trackedGameFiles.has(file)) {
        trackedGameFiles.set(file, stat.size);
      }

      const prevSize = trackedGameFiles.get(file);
      if (stat.size > prevSize) {
        trackedGameFiles.set(file, stat.size);
        const buf = Buffer.alloc(stat.size - prevSize);
        const fd = fs.openSync(file, 'r');
        fs.readSync(fd, buf, 0, buf.length, prevSize);
        fs.closeSync(fd);

        const text = buf.toString('utf8');
        const listener = getGamelogListener(file);
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const jumpMatch = line.match(/Jumping from\s+([^\r\n]+?)\s+to\s+([^\r\n]+)/i);
          if (jumpMatch) {
            const from = jumpMatch[1].replace(/<[^>]+>/g, '').trim();
            const to = jumpMatch[2].replace(/<[^>]+>/g, '').trim();
            if (to) {
              handleSystemTransition(to, from, listener);
            }
          }
          const undockMatch = line.match(/Undocking from .+ to ([^\r\n]+) solar system/i);
          if (undockMatch) {
            const sys = undockMatch[1].replace(/<[^>]+>/g, '').trim();
            if (sys) {
              handleSystemTransition(sys, null, listener);
            }
          }
        }
      }
    } catch (e) {}
  }
}

// Initial sweep on boot to find latest pilot positions without broadcasting JUMP spam
function initBootState() {
  if (!eveLogsBase) {
    isBootSweep = false;
    return;
  }
  const chatDir = path.join(eveLogsBase, 'Chatlogs');
  if (fs.existsSync(chatDir)) {
    try {
      const files = fs.readdirSync(chatDir)
        .filter(f => f.startsWith('Local_') && f.endsWith('.txt'))
        .map(f => path.join(chatDir, f));
      for (const file of files) {
        try {
          const stat = fs.statSync(file);
          trackedChatFiles.set(file, stat.size);
          const listener = getChatListener(file);
          if (listener) {
            const readLen = Math.min(stat.size, 30000);
            let start = stat.size - readLen;
            if (start % 2 !== 0) start--;
            const buf = Buffer.alloc(readLen);
            const fd = fs.openSync(file, 'r');
            fs.readSync(fd, buf, 0, readLen, start);
            fs.closeSync(fd);
            const text = buf.toString('utf16le');
            const matches = [...text.matchAll(/Channel changed to Local\s*:\s*([^\r\n]+)/gi)];
            if (matches.length > 0) {
              const lastSys = matches[matches.length - 1][1].replace(/<[^>]+>/g, '').trim();
              if (lastSys) {
                handleSystemTransition(lastSys, null, listener);
              }
            }
          }
        } catch {}
      }
    } catch {}
  }

  const gameDir = path.join(eveLogsBase, 'Gamelogs');
  if (fs.existsSync(gameDir)) {
    try {
      const files = fs.readdirSync(gameDir)
        .filter(f => f.endsWith('.txt'))
        .map(f => path.join(gameDir, f));
      for (const file of files) {
        try {
          const stat = fs.statSync(file);
          trackedGameFiles.set(file, stat.size);
        } catch {}
      }
    } catch {}
  }

  isBootSweep = false;
}

initBootState();

// High frequency polling (every 400ms for instant reaction)
setInterval(pollActiveChatlogs, 400);
setInterval(pollActiveGamelogs, 500);

// Background Windows OS Clipboard Listener
// Allows hands-free scanning: when you press Ctrl+C in EVE, this reads it from the OS without tabbing out!
let lastSeenClipboard = '';
let isCheckingClip = false;

setInterval(() => {
  if (isCheckingClip) return;
  isCheckingClip = true;

  exec('powershell.exe -NoProfile -Command "Get-Clipboard -Raw"', { timeout: 3000 }, (err, stdout) => {
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
