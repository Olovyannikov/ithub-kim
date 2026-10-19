import { VALIDATION_MESSAGES, type ApiErrorResponse } from '@kim/shared';
import { createEvent } from 'effector';

/**
 * Единственная точка обращения к серверу (ADR-0006).
 *
 * Адрес всегда относительный: локально запрос уходит через прокси Vite, на
 * площадке ДЭ — на тот же сервер, что отдал фронтенд. Абсолютных адресов
 * бэкенда в коде быть не должно, иначе сборка перестанет быть переносимой.
 */
const API_PREFIX = '/api';

/** Сессия закончилась. Слушает модель сессии, а не каждый вызов по отдельности. */
export const sessionExpired = createEvent();

/**
 * Ошибка от сервера в разобранном виде.
 *
 * `fieldErrors` — то, что формы раскладывают по полям через
 * `applyServerErrors`: и ошибки валидации, и нарушения бизнес-правил приходят
 * в одном формате (ADR-0005).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** Есть ли сообщение для конкретного поля формы. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors[field];
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Не сообщать модели сессии про 401 — нужно для самой проверки сессии. */
  silentUnauthorized?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_PREFIX}${path}`;

  if (!query) {
    return url;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const search = params.toString();

  return search ? `${url}?${search}` : url;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      // Обязательно: сессия живёт в httpOnly-cookie (ADR-0004). Без этого
      // cookie не уедет, и всё выглядит как «авторизация не работает».
      credentials: 'include',
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    // Сеть недоступна — ответа нет вообще, поэтому статуса тоже нет.
    throw new ApiError(0, 'Сервер недоступен. Проверьте, запущен ли бэкенд');
  }

  if (response.status === 401 && !options.silentUnauthorized) {
    sessionExpired();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload ?? {}) as Partial<ApiErrorResponse>;

    throw new ApiError(
      response.status,
      error.message ?? VALIDATION_MESSAGES.serverError,
      error.errors ?? {},
    );
  }

  return payload as T;
}
