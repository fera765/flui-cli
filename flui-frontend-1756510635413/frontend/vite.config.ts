import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: 'localhost'
    },
    proxy: {}
  }
})