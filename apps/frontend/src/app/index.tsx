import { MantineProvider } from '@mantine/core';
import { useEffect } from 'react';

import { cssVariablesResolver, theme } from '../shared/theme';
import { startApp } from './bootstrap';
import { AppRouter } from './router';

import '@mantine/core/styles.css';
import '../shared/theme/fonts.css';

export function App() {
  useEffect(() => {
    // Единственная точка входа в логику приложения: инициализация роутера и
    // проверка сессии (ADR-0006).
    startApp();
  }, []);

  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light"
    >
      <AppRouter />
    </MantineProvider>
  );
}
