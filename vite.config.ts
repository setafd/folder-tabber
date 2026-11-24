import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { type Plugin, defineConfig } from 'vite';

import baseManifest from './public/manifest.json';

export default defineConfig(({ mode }) => {
  const firefox = mode === 'firefox';
  const manifest = {
    ...baseManifest,
    permissions: [...new Set(baseManifest.permissions)].filter((permission) => !firefox || permission !== 'favicon'),
    ...(firefox
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'folder-tabber@setafd.github.io',
              strict_min_version: '140.0',
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : {}),
  };
  const extensionManifest: Plugin = {
    name: 'extension-manifest',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify(manifest, null, 2) });
    },
  };
  return {
    publicDir: false,
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [react(), extensionManifest],
    build: {
      outDir: firefox ? 'build-firefox' : 'build',
      rollupOptions: { input: { main: './index.html' } },
    },
    server: { open: true, port: 3000 },
    css: { preprocessorOptions: { scss: { api: 'modern', style: 'expanded' } } },
  };
});
