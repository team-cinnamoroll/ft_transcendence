import { defineConfig } from 'vite';
import devServer from '@hono/vite-dev-server';

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.ts',
      exclude: [/.*\.ts$/, /.*\.tsx$/, /^\/@.+$/, /^\/favicon\.ico$/, /^\/node_modules\/.*/],
    }),
  ],
  ssr: {
    external: ['argon2'],
  },
  server: {
    host: '0.0.0.0',
    port: 8000,
    allowedHosts: ['backend'],
    forwardConsole: {
      unhandledErrors: true, // 未キャッチのエラーやPromise拒否を転送
      logLevels: ['error', 'warn', 'info', 'log'], // 転送したいconsoleのレベル
    },
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
});
