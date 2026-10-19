import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Браузерные API, которых нет в happy-dom, но которые нужны Mantine.
 *
 * Без matchMedia падают компоненты с `visibleFrom`/`hiddenFrom`, без
 * ResizeObserver — всё, что меряет себя (Select, Modal).
 */
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!globalThis.scrollTo) {
  globalThis.scrollTo = vi.fn() as unknown as typeof globalThis.scrollTo;
}

afterEach(() => {
  cleanup();
});
