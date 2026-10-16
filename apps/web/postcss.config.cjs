module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        // Точка разрыва мобильного макета из задания: 390x844 (Задание 2).
        'mantine-breakpoint-xs': '23.4375em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '64em',
        'mantine-breakpoint-lg': '74em',
        'mantine-breakpoint-xl': '90em',
      },
    },
  },
};
