import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/pokemon-dex/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['homeScreen-icon.svg', 'icons/*'],
      manifest: {
        name: 'Pokemon Dex React',
        short_name: 'PokeDex',
        description: 'A comprehensive Pokemon database with Chinese and English names, featuring shiny Pokemon support',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
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
          'pokemon-data': ['./src/data/complete_pokemon_database.json'],
          'pokemon-utils': [
            './src/utils/pokemonNamesHelper.js',
            './src/utils/fuzzySearch.js',
            './src/utils/spriteUtils.js',
            './src/utils/localSpriteUtils.js'
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
