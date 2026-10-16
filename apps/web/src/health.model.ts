import { createEffect, createStore, sample } from 'effector';

/**
 * Проверочная модель каркаса: подтверждает, что цепочка
 * React → Effector → Vite proxy → NestJS работает.
 *
 * Паттерны моделей, работа с запросами и структура слоёв
 * фиксируются в ADR-0006 (Часть 3) — этот файл будет удалён.
 */

export interface HealthResponse {
  status: string;
  roomKinds: readonly string[];
  applicationStatuses: readonly string[];
}

export const appStarted = createEffect<void, void>(() => {});

export const fetchHealthFx = createEffect<void, HealthResponse>(async () => {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error(`Сервер ответил ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
});

export const $health = createStore<HealthResponse | null>(null).on(
  fetchHealthFx.doneData,
  (_, health) => health,
);

export const $error = createStore<string | null>(null)
  .on(fetchHealthFx.failData, (_, error) => error.message)
  .reset(fetchHealthFx);

export const $pending = fetchHealthFx.pending;

sample({ clock: appStarted, target: fetchHealthFx });
