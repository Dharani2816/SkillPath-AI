import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: { manualChunks: { charts: ['recharts'], vendor: ['react', 'react-dom', 'react-router-dom', 'axios'] } },
    },
  },
  server: {
    port: 5173,
    // Same-origin API calls in development; the backend runs on :5000.
    proxy: { '/api': process.env.VITE_API_PROXY || 'http://localhost:5000' },
  },
});
