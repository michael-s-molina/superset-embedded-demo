import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  preview: {
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(',') || ['localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['@superset-ui/embedded-sdk'],
  },
  build: {
    commonjsOptions: {
      include: [/@superset-ui\/embedded-sdk/, /node_modules/],
    },
  },
})
