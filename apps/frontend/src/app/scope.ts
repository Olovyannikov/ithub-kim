import { historyAdapter } from '@effector/router';
import { allSettled, fork, type Scope } from 'effector';
import { createBrowserHistory } from 'history';

import { router } from '../shared/routes';
import { appStarted } from './bootstrap';

/**
 * Приложение работает в изолированном Scope (ADR-0006).
 *
 * Зачем это на клиенте, где вроде бы хватило бы глобальных юнитов:
 *
 * 1. Состояние не живёт в модулях. Юниты становятся описанием логики, а данные
 *    лежат в Scope — и тесты работают с приложением так же, как сам браузер:
 *    через `fork` и `allSettled`. Проверенный путь совпадает с рабочим.
 * 2. `eslint-plugin-effector` с конфигурацией `scope` начинает требовать
 *    `useUnit` и `allSettled` вместо прямых вызовов — класс ошибок «вызвал
 *    эффект напрямую, состояние обновилось не там» перестаёт существовать.
 * 3. Дорога к SSR открыта: если понадобится, добавляется только сериализация.
 *
 * Цена: любой императивный запуск юнита идёт через `allSettled`, а не вызовом.
 */
export async function createAppScope(): Promise<Scope> {
  const scope = fork();

  // Порядок важен: сначала история — иначе router.navigate отвечает
  // `navigationFailed` с причиной `not-initialized`, и роуты не откроются.
  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createBrowserHistory()),
  });

  // Сессию проверяем до первого рендера. Это один запрос к своему же API, зато
  // пользователь с действующей cookie не видит вспышку формы входа перед
  // переходом на свои заявки.
  await allSettled(appStarted, { scope });

  return scope;
}
