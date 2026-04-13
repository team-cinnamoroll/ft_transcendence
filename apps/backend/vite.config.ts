import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.ts',
    }),
  ],
  ssr: {
    noExternal: ['hono', '@hono/node-server'],
  },
  server: {
    host: '0.0.0.0',
    port: 8000,
    allowedHosts: ['backend'],
  },
  build: {
    ssr: 'src/index.ts',
    outDir: 'dist',
    target: 'node24',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
      },
    },
  },
})
