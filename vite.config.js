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
      includeAssets: ['pokemonBall.svg', 'icons/*'],
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
            src: 'pokemonBall.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pokemonBall.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          // Custom icons will be added here when user uploads them
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
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
