import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Provider } from 'effector-react';
import type { Scope } from 'effector';

import { cssVariablesResolver, theme } from '../shared/theme';
import { ErrorBoundary } from './error-boundary';
import { AppRouter } from './router';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'dayjs/locale/ru';
import '../shared/theme/fonts.css';
import '../shared/theme/motion.css';

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
        {/*
          Локаль и начало недели задаются здесь, а не у каждого поля: названия
          месяцев и дней должны быть русскими, а неделя — начинаться с
          понедельника, как принято у пользователя.
        */}
        <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
          {/* Граница ошибок внутри провайдеров: экран 500 оформлен темой заказчика. */}
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </DatesProvider>
      </MantineProvider>
    </Provider>
  );
}
