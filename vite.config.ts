import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'ryng-favicon.svg', 'apple-touch-icon.png'],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Ryng — Zirkeltraining Timer',
        short_name: 'Ryng',
        description: 'Zirkeltraining-Timer mit Trainingsplänen und Session-Tracking',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/ryng-logo-64.png', sizes: '64x64', type: 'image/png' },
          { src: '/ryng-logo-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/ryng-logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/ryng-logo-256.png', sizes: '256x256', type: 'image/png' },
          { src: '/ryng-logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/ryng-logo.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})
