import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import sass from 'sass';

export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.',
        }
      ],
    }),
  ],
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    open: true,
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      scss: {
        implementation: sass,
        sassOptions: {
          outputStyle: 'expanded',
        },
      }
    }
  },
  resolve: {
    alias: {
      '@app': '/src/app',
      '@pages': '/src/pages',
      '@widgets': '/src/widgets',
      '@features': '/src/features',
      '@entities': '/src/entities',
      '@shared': '/src/shared',
    },
  },
});