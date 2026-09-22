import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Daylight/',
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { charts: ['recharts'], data: ['dexie', 'zod'] } } } },
});
