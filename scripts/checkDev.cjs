const fs = require('fs');

async function crawl() {
  const visited = new Set();
  const queue = ['/src/main.tsx'];

  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    const res = await fetch('http://127.0.0.1:3000' + url);
    if (res.status !== 200) {
      console.error('ERROR FETCHING:', url, res.status);
      const text = await res.text();
      console.error(text.slice(0, 300));
      continue;
    }
    const code = await res.text();
    // find import statements
    const re = /(?:from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"])/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      const imp = m[1] || m[2];
      if (imp.startsWith('/') || imp.startsWith('.')) {
        // resolve relative
        let resolved = imp;
        if (imp.startsWith('.')) {
          const base = url.slice(0, url.lastIndexOf('/') + 1);
          resolved = new URL(imp, 'http://127.0.0.1:3000' + base).pathname;
        }
        if (!visited.has(resolved) && !queue.includes(resolved)) {
          queue.push(resolved);
        }
      }
    }
  }
  console.log('Successfully crawled', visited.size, 'modules without errors!');
}

crawl().catch(console.error);
