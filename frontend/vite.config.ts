import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@schema': fileURLToPath(new URL('../schema', import.meta.url)),
    },
  },
  server: {
    strictPort: true,
  },
  test: {
    environment: 'node',
  },
})
