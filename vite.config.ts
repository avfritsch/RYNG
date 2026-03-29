import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ryng-favicon.ico', 'ryng-favicon.svg', 'ryng-r-180.png', 'ryng-r-32.png', 'ryng-r-16.png'],
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
          { src: '/ryng-r-16.png', sizes: '16x16', type: 'image/png' },
          { src: '/ryng-r-32.png', sizes: '32x32', type: 'image/png' },
          { src: '/ryng-r-48.png', sizes: '48x48', type: 'image/png' },
          { src: '/ryng-r-64.png', sizes: '64x64', type: 'image/png' },
          { src: '/ryng-r-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/ryng-r-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/ryng-r-256.png', sizes: '256x256', type: 'image/png' },
          { src: '/ryng-r-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
