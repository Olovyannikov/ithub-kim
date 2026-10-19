import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import effector from 'eslint-plugin-effector';
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

  // Фронтенд: React и Effector
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

  /*
   * eslint-plugin-effector — https://eslint.effector.dev
   *
   * Ловит ровно те ошибки, которые иначе находятся только в рантайме:
   * забытый `sample` вместо вызова эффекта из обработчика, утечка юнитов
   * между scope, неправильное использование хуков effector-react.
   * Для нас это страховка под таймером: такие ошибки в день экзамена искать
   * дороже всего (ADR-0006).
   *
   * Конфиг `scope` не включаем: `fork`/`Provider` используются только в
   * тестах, а в приложении Scope не применяется — иначе правила требовали бы
   * передавать scope там, где его нет.
   */
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    ...effector.flatConfigs.recommended,
    languageOptions: {
      ...effector.flatConfigs.recommended.languageOptions,
      // Часть правил плагина опирается на типы (например, проверка имён
      // эффектов), поэтому для фронтенда включён типизированный линтинг.
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    ...effector.flatConfigs.react,
  },
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    ...effector.flatConfigs.patronum,
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
