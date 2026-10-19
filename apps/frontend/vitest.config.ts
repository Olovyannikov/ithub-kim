import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Тесты фронтенда на vitest с happy-dom.
 *
 * happy-dom, а не jsdom: он заметно быстрее и нам хватает его возможностей —
 * компоненты Mantine и формы работают, браузерные API, которых не хватает,
 * добиваются в `src/test/setup.ts`.
 *
 * Сквозные проверки в настоящем браузере живут отдельно — `pnpm e2e`.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
