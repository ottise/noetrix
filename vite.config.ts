import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const SOURCE_STORE_REL = 'src/data/noetrix-store.json';

function noetrixSourceStoragePlugin(): Plugin {
  const storePath = path.resolve(__dirname, SOURCE_STORE_REL);

  return {
    name: 'noetrix-source-storage',
    configureServer(server) {
      server.middlewares.use('/__noetrix_source_store', (req, res) => {
        if (req.method === 'GET') {
          try {
            if (fs.existsSync(storePath)) {
              const raw = fs.readFileSync(storePath, 'utf-8');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(raw);
              return;
            }
          } catch {
            // ignore read errors
          }
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ empty: true }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const dir = path.dirname(storePath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              // Validate JSON before saving to source code
              const parsed = JSON.parse(body);
              fs.writeFileSync(storePath, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ ok: true, savedTo: SOURCE_STORE_REL }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  ok: false,
                  error: err instanceof Error ? err.message : 'Invalid JSON',
                })
              );
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/src/data/noetrix-store.json'],
    },
  },
  plugins: [
    noetrixSourceStoragePlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'NOETRIX — The Art of Becoming',
        short_name: 'NOETRIX',
        description:
          'Curious by nature. Mischievous by design. Pure in pursuit. A private digital room for learning, creating, and becoming.',
        theme_color: '#101114',
        background_color: '#101114',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-media-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-media-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          db: ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
});
