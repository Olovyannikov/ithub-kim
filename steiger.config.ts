import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

/**
 * Проверка границ Feature-Sliced Design.
 *
 * Структура намеренно урезана (ADR-0006): слои `app`, `pages`, `entities`,
 * `shared`, без `features` и `widgets` — на пять страниц полный набор даёт
 * папки с одним файлом. Правила при этом не ослаблены: набор `recommended`
 * применяется как есть, и проект ему соответствует.
 */
export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/dist-test/**'],
  },
]);
