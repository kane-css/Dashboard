import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Dashboard/', // 👈 your repo name, with slashes!
  build: {
    outDir: 'dist',
  },
})
