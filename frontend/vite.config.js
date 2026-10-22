import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        // Development-only proxy. Production requests use VITE_API_BASE_URL
        // (or same-origin /api via a reverse proxy) through src/api.js.
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
