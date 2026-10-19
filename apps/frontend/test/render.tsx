import { MantineProvider } from '@mantine/core';
import { render, type RenderResult } from '@testing-library/react';
import { fork, type Scope } from 'effector';
import { Provider } from 'effector-react';
import type { ReactElement } from 'react';

import { theme } from '../src/shared/theme';

/**
 * Рендер компонента в тех же провайдерах, что и приложение.
 *
 * Каталог `test` лежит рядом с `src`, а не внутри него: это не слой
 * Feature-Sliced Design, а инструмент проверки, и правило импортов
 * «только вниз» на него не распространяется.
 *
 * Scope создаётся на каждый тест: состояние не протекает между проверками, и
 * путь ровно тот же, каким приложение работает в браузере (ADR-0006).
 */
export function renderWithProviders(
  ui: ReactElement,
  { scope = fork() }: { scope?: Scope } = {},
): RenderResult & { scope: Scope } {
  const result = render(
    <Provider value={scope}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        {ui}
      </MantineProvider>
    </Provider>,
  );

  return { ...result, scope };
}
