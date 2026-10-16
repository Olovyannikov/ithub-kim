import { createTheme } from '@mantine/core';

/**
 * Заготовка темы. Корпоративный стиль заказчика и дизайн-токены
 * проектируются в Части 5 (ADR-0008) — здесь только каркас,
 * чтобы провайдер был на месте.
 */
export const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});
