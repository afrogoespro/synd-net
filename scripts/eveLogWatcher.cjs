/**
 * EVE Online Live Game Log Watcher
 * Tails the latest .txt file in Documents/EVE/logs/Gamelogs/
 * Whenever you jump into a system or wormhole, it detects the change and notifies the web app!
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

// Locate EVE logs directory
const defaultEveLogDir = path.join(os.homedir(), 'Documents', 'EVE', 'logs', 'Gamelogs');

console.log('====================================================');
console.log('🛸 AURA RECON // EVE GAME LOG LIVE BRIDGE');
console.log('====================================================');
console.log(`Watching directory: ${defaultEveLogDir}`);

if (!fs.existsSync(defaultEveLogDir)) {
  console.log(`\n⚠️  EVE Log directory not found yet:`);
  console.log(`   ${defaultEveLogDir}`);
  console.log(`   (Make sure EVE Online has been launched at least once on this PC)`);
}

// Find most recently modified log file
function getLatestLogFile() {
  if (!fs.existsSync(defaultEveLogDir)) return null;
  const files = fs.readdirSync(defaultEveLogDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => {
      const full = path.join(defaultEveLogDir, f);
      return { file: full, mtime: fs.statSync(full).mtime.getTime() };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].file : null;
}

let currentFile = getLatestLogFile();
let currentSize = currentFile ? fs.statSync(currentFile).size : 0;
let lastKnownSystem = '';

console.log(`Initial log file: ${currentFile ? path.basename(currentFile) : 'None found (waiting for EVE client)'}`);

// Tiny HTTP / Event server on port 3001 for the web app to query current location
let activeClients = [];
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/location') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connected: true,
      currentSystem: lastKnownSystem || 'Waiting for jump...',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Server-Sent Events stream for real-time instant alerts
  if (req.url === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    activeClients.push(res);
    req.on('close', () => {
      activeClients = activeClients.filter(c => c !== res);
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3001, () => {
  console.log('📡 Bridge server running on http://localhost:3001');
  console.log('   (Your web app at http://localhost:3000 will automatically link to this!)');
});

function broadcastJump(systemName) {
  console.log(`\n🚀 [JUMP DETECTED] Solar System: ${systemName}`);
  activeClients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify({ type: 'JUMP', systemName })}\n\n`);
    } catch (e) {}
  });
}

// Watch loop
setInterval(() => {
  const latest = getLatestLogFile();
  if (latest && latest !== currentFile) {
    currentFile = latest;
    currentSize = fs.statSync(latest).size;
    console.log(`Switched to active game session log: ${path.basename(latest)}`);
  }

  if (!currentFile || !fs.existsSync(currentFile)) return;

  const stat = fs.statSync(currentFile);
  if (stat.size > currentSize) {
    const stream = fs.createReadStream(currentFile, {
      start: currentSize,
      end: stat.size,
      encoding: 'utf8'
    });

    let newContent = '';
    stream.on('data', chunk => { newContent += chunk; });
    stream.on('end', () => {
      currentSize = stat.size;
      const lines = newContent.split(/\r?\n/);
      for (const line of lines) {
        // EVE log line format for system change:
        // "Session changed to Solar System: J152438" or "Session changed to Solar System: Jita"
        const match = line.match(/Session changed to Solar System:\s*([A-Za-z0-9\-]+)/i);
        if (match) {
          const sys = match[1].trim();
          if (sys !== lastKnownSystem) {
            lastKnownSystem = sys;
            broadcastJump(sys);
          }
        }
      }
    });
  }
}, 1000);
