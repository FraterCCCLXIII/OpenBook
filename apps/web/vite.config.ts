import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

// Bundle shared package from TypeScript source. The published dist/ is CommonJS for Nest;
// Vite needs ESM named exports in the browser.
const sharedEntry = path.resolve(workspaceRoot, '../../packages/shared/src/index.ts');

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@openbook/shared': sharedEntry,
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
  /** CI runs `vite preview` on 5174 — proxy must match dev server for Playwright. */
  preview: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
});
