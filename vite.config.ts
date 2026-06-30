import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    exclude: ['node_modules/**', 'dist/**'],
    // jsdom + React render under parallel load can exceed the 5s default on
    // slower/CI machines (the exercise-library smoke renders the full catalog).
    // Raise the per-test ceiling; tests still complete in well under 1s alone.
    testTimeout: 15000,
  },
})
