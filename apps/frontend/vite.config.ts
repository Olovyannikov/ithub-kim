import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // @kim/shared собирается в CommonJS (см. ADR-0002) — просим Vite
    // предварительно обработать его, иначе интероп в dev-режиме ломается.
    include: ['@kim/shared'],
  },
  server: {
    port: 5173,
    proxy: {
      // Фронтенд всегда обращается к относительному /api — так одна и та же
      // сборка работает и локально, и за общим сервером на площадке ДЭ.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
