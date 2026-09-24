/// <reference types="vitest/config" />
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Injects the hashed asset list and a build id into the service worker so the
 * precache always matches the current build. Falls back to a runtime cache if
 * the worker file is missing.
 */
function serviceWorkerPrecache(): Plugin {
  return {
    name: 'lumbar-rehab:sw-precache',
    apply: 'build',
    enforce: 'post',
    async generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter(
        (name) => name.startsWith('assets/') || name.endsWith('.webmanifest'),
      );
      const buildId = Date.now().toString(36);
      const swPath = resolve(process.cwd(), 'public/sw.js');
      let source: string;
      try {
        source = await readFile(swPath, 'utf8');
      } catch {
        source = 'self.addEventListener("install", () => self.skipWaiting());';
      }
      const output = source
        .replace("'__BUILD_ID__'", JSON.stringify(buildId))
        .replace("'__APP_ASSETS__'", JSON.stringify(assets));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: output });
      void writeFile;
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerPrecache()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The sandbox preview and any reverse proxy may serve this app under a
    // non-localhost origin; never restrict by origin.
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
