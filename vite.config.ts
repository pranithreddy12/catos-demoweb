import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The frontend calls the FastAPI backend through a /api proxy to avoid CORS.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Auto-injects the service-worker registration into the app entry, so
      // beta users always pull the latest build without a hard refresh.
      injectRegister: 'auto',
      includeAssets: ['icon-source.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'LunaCat — Cat Health Intelligence',
        short_name: 'LunaCat',
        description:
          'Track your cat’s health, spot changes early, and share a clear summary with your vet.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#faf7f1',
        background_color: '#faf7f1',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // SPA fallback for client-side routes, but never hijack API calls.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Health data must always be live — go to network, don't serve stale.
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // Lets you test install / SW behaviour with `npm run dev`.
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5174,
    // Allow access through tunnels (ngrok etc.) so the app can be viewed
    // off-machine during dev. '.ngrok-free.dev' covers any ngrok subdomain.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8009',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
