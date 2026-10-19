import { MantineProvider } from '@mantine/core';
import { render, type RenderResult } from '@testing-library/react';
import { fork, type Scope } from 'effector';
import { Provider } from 'effector-react';
import type { ReactElement } from 'react';

import { theme } from '../shared/theme';

/**
 * Рендер компонента в тех же провайдерах, что и приложение.
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
