import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/*.exe', '**/*.bat', '**/logs/**']
    },
    proxy: {
      // Proxy zKillboard API to prevent CORS issues in local browser
      '/api/zkill': {
        target: 'https://zkillboard.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zkill/, '/api'),
        headers: {
          'User-Agent': 'EVE-Intel-Recon-Suite - Developer App (Antigravity Assistant)'
        }
      },
      // Proxy EVE ESI API
      '/api/esi': {
        target: 'https://esi.evetech.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/esi/, '/latest')
      },
      // Proxy local Map & Sync server to port 3001
      '/api/map': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});
