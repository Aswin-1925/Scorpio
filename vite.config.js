import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Optimized for Vercel Root Deployment
export default defineConfig({
  plugins: [react()],
  base: '/', // Change this from '/Scorpio/' to '/'
  build: {
    outDir: 'dist',
  }
})