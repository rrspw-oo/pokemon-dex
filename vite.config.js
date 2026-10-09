import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/pokemon-dex/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      devOptions: {
        enabled: false
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(raw\.githubusercontent\.com|cdn\.jsdelivr\.net\/gh)\/PokeAPI\/sprites.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sprites-cache',
              expiration: {
                maxEntries: 2500,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/assets\.tcgdex\.net\/.*\.webp$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cards-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      includeAssets: ['homeScreen-icon.svg', 'icons/*.png'],
      manifest: {
        name: 'POKÉMON OMNISEARCH',
        short_name: 'POKÉMON OMNISEARCH',
        description: 'A comprehensive Pokemon database with Chinese and English names, featuring shiny Pokemon support',
        theme_color: '#c9c6be',
        background_color: '#c9c6be',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/pokemon-dex/',
        start_url: '/pokemon-dex/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'homeScreen-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pokemon-data': [
            './src/data/complete_pokemon_database.json',
            './src/data/evolution_chains.json'
          ],
          'pokemon-utils': [
            './src/utils/searchIndex.js',
            './src/utils/evolutionIndex.js'
          ],
          'pokemon-api': ['./src/services/pokemonApi.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
