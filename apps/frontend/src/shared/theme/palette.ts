/**
 * Палитра из руководства по стилю заказчика — docs/design/styleguide.md.
 *
 * Единственный источник цветов в приложении. HEX-коды в компонентах не
 * появляются: только токены Mantine (ADR-0007).
 *
 * Руководство даёт по одному значению на цвет, а Mantine ожидает десять
 * оттенков. Оттенки 0–5 и 7–9 получены интерполяцией к белому и чёрному,
 * **индекс 6 равен значению заказчика в точности** — именно его Mantine
 * использует для primaryColor.
 */
import type { MantineColorsTuple } from '@mantine/core';

/** Голубой #007bff — основной акцент. */
export const brandBlue: MantineColorsTuple = [
  '#ebf4ff',
  '#cce5ff',
  '#a3cfff',
  '#75b8ff',
  '#47a0ff',
  '#218cff',
  '#007bff',
  '#006adb',
  '#0059b8',
  '#004794',
];

/** Темно-синий #0d47a1 — заголовки и насыщенные акценты. */
export const brandNavy: MantineColorsTuple = [
  '#ecf0f7',
  '#cfdaec',
  '#a8bddd',
  '#7c9ccc',
  '#517bbb',
  '#2c5fad',
  '#0d47a1',
  '#0b3d8a',
  '#093374',
  '#08295d',
];

/** Серый #6c757d — вспомогательный текст. */
export const BRAND_GRAY = '#6c757d';

/** Фон страницы #f8f9fa. */
export const BRAND_BACKGROUND = '#f8f9fa';

/** Выделяющий #ffffff — фон карточек и выделенных блоков. */
export const BRAND_SURFACE = '#ffffff';
