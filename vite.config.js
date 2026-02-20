import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vercel handles the root, so we ensure base is set to '/'
  base: '/', 
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})