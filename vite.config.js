import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'ระบบบริการสุขภาพปฐมภูมิ รพ.สต.',
        short_name: 'PHC Care',
        theme_color: '#1b6f53',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ]
})