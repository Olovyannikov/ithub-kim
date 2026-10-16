import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';

import '@mantine/core/styles.css';

import { App } from './App';
import { theme } from './theme';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Не найден контейнер #root');
}

createRoot(container).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>,
);
