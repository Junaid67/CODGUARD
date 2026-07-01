import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app is served inside the Shopify Admin iframe behind a single tunnel
// (shopify app dev tunnels this frontend as app_home). The backend runs as a
// separate process on its own port — `shopify app dev` injects BACKEND_PORT
// into this process's env, and we proxy /api/* to it so the frontend can call
// the API via a same-origin relative path (no CORS, works through the tunnel).
const backendPort = process.env.BACKEND_PORT ?? process.env.PORT ?? '5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    host: true,
    cors: true,
    // Vite 6: allow any host (needed when served through a tunnel domain).
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
});
