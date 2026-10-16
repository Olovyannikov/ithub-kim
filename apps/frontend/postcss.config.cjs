module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      // Значения по умолчанию из документации Mantine (docs/stack/mantine/getting-started.md).
      // Менять осознанно и только в рамках ADR-0008 (Часть 5): мобильный макет
      // задания — 390x844, и под него может понадобиться своя точка разрыва.
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
