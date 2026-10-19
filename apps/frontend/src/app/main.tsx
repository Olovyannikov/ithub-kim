import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './index';
import { createAppScope } from './scope';

// Точка входа — часть слоя `app`: именно он отвечает за запуск приложения,
// провайдеры и инициализацию Scope (ADR-0006).
const container = document.getElementById('root');

if (!container) {
  throw new Error('Не найден контейнер #root');
}

const root = createRoot(container);

// Рендер после инициализации Scope: роутер должен знать историю, а сессия —
// быть проверена, иначе пользователь увидит вспышку формы входа (ADR-0006).
void createAppScope().then((scope) => {
  root.render(
    <StrictMode>
      <App scope={scope} />
    </StrictMode>,
  );
});
