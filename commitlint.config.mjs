/**
 * Conventional Commits. Тип коммита обязателен, чтобы история читалась
 * экспертом и чтобы по ней было видно прогресс по заданиям ДЭ.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // В сообщениях встречается русский текст — не навязываем регистр.
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
  },
};
