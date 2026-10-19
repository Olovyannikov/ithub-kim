import { MantineProvider } from '@mantine/core';
import { Provider } from 'effector-react';
import type { Scope } from 'effector';

import { cssVariablesResolver, theme } from '../shared/theme';
import { AppRouter } from './router';

import '@mantine/core/styles.css';
import '../shared/theme/fonts.css';

/**
 * Провайдеры приложения. Scope создаётся до рендера (см. `app/scope.ts`),
 * поэтому компонент не занимается запуском логики.
 */
export function App({ scope }: { scope: Scope }) {
  return (
    <Provider value={scope}>
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        defaultColorScheme="light"
      >
        <AppRouter />
      </MantineProvider>
    </Provider>
  );
}
