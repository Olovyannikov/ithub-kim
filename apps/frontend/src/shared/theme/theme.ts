import { createTheme, type CSSVariablesResolver } from '@mantine/core';

import { BRAND_BACKGROUND, BRAND_GRAY, BRAND_SURFACE, brandBlue, brandNavy } from './palette';

/**
 * Тема собрана из руководства по стилю заказчика (ADR-0007).
 *
 * Размеры заголовков и текста заданы здесь, а не расставлены по компонентам:
 * иначе типографика расползётся и перестанет соответствовать руководству.
 */
export const theme = createTheme({
  colors: {
    brand: brandBlue,
    navy: brandNavy,
  },
  primaryColor: 'brand',
  // Индекс 6 — это и есть #007bff из руководства.
  primaryShade: 6,
  defaultRadius: 'md',

  // Штатная настройка Mantine: собственные переходы компонентов отключаются,
  // если в системе включено «уменьшить движение».
  respectReducedMotion: true,

  fontFamily: "'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  headings: {
    fontFamily: "'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    fontWeight: '700',
    sizes: {
      // Руководство по стилю: H1 36px, H2 24px, H3 18px.
      h1: { fontSize: '2.25rem', lineHeight: '1.2' },
      h2: { fontSize: '1.5rem', lineHeight: '1.3' },
      h3: { fontSize: '1.125rem', lineHeight: '1.4' },
    },
  },
  fontSizes: {
    // Вспомогательный текст 12px, основной 16px.
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  lineHeights: {
    md: '1.55',
  },
  other: {
    surface: BRAND_SURFACE,
  },
});

/**
 * Фон страницы и цвет вспомогательного текста — из руководства по стилю.
 * Переопределяем переменные Mantine, чтобы не красить элементы по месту.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': BRAND_BACKGROUND,
    '--mantine-color-dimmed': BRAND_GRAY,
  },
  dark: {},
});
