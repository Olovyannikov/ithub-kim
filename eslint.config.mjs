import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Единый стандарт кодирования на весь репозиторий.
 * Прямо работает на критерий Задания 3 «оформлять код программы
 * в соответствии со стандартом кодирования».
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-test/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      'docs/stack/mantine/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  // Бэкенд: NestJS
  {
    files: ['apps/backend/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // NestJS внедряет зависимости по рантайм-метаданным типов
      // (emitDecoratorMetadata). `import type` стирает импорт из вывода, и DI
      // перестаёт находить класс — ошибка проявляется только при старте
      // приложения. На экзаменационном таймере это худший вид отладки,
      // поэтому правило здесь отключено осознанно.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  // Фронтенд: React
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Конфиги сборки
  {
    files: ['**/*.config.{js,mjs,cjs,ts}', '**/postcss.config.cjs'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Prettier последним: отключает правила, конфликтующие с форматтером.
  prettier,
);
