import { VALIDATION_MESSAGES, type ApiErrorResponse } from '@kim/shared';
import { createEvent } from 'effector';
import { FetchError, ofetch } from 'ofetch';

/**
 * Единственная точка обращения к серверу (ADR-0006).
 *
 * Адрес всегда относительный: локально запрос уходит через прокси Vite, на
 * площадке ДЭ — на тот же сервер, что отдал фронтенд. Абсолютных адресов
 * бэкенда в коде быть не должно, иначе сборка перестанет быть переносимой.
 */
const BASE_URL = '/api';

/** Сессия закончилась. Слушает модель сессии, а не каждый вызов по отдельности. */
export const sessionExpired = createEvent();

/**
 * Ошибка от сервера в разобранном виде.
 *
 * `fieldErrors` — то, что формы раскладывают по полям: и ошибки валидации, и
 * нарушения бизнес-правил приходят в одном формате (ADR-0005).
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

/** Приводит всё, что может прилететь из ofetch, к нашей ApiError. */
function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof FetchError) {
    const status = error.response?.status ?? 0;

    // Сети нет — ответа не было вообще, поэтому и статуса нет.
    if (status === 0) {
      return new ApiError(0, 'Сервер недоступен. Проверьте, запущен ли бэкенд');
    }

    const payload = (error.data ?? {}) as Partial<ApiErrorResponse>;

    return new ApiError(
      status,
      payload.message ?? VALIDATION_MESSAGES.serverError,
      payload.errors ?? {},
    );
  }

  return new ApiError(0, VALIDATION_MESSAGES.serverError);
}

const common = {
  baseURL: BASE_URL,
  // Обязательно: сессия живёт в httpOnly-cookie (ADR-0004). Без этого cookie
  // не уедет, и всё выглядит как «авторизация не работает».
  credentials: 'include' as const,
  // Сервер отдаёт осмысленное тело и при ошибке — оно нужно нам целиком.
  ignoreResponseError: false,
};

/**
 * Основной клиент. Перехватчик превращает 401 в событие «сессия закончилась»,
 * чтобы на это реагировала модель сессии, а не каждый вызов по отдельности.
 */
const apiFetch = ofetch.create({
  ...common,
  onResponseError({ response }) {
    if (response.status === 401) {
      sessionExpired();
    }
  },
});

/**
 * Клиент без реакции на 401.
 *
 * Нужен ровно для `GET /auth/me`: там 401 — это нормальный ответ «не вошёл», а
 * не истёкшая сессия. Через общий клиент гость на странице регистрации получал
 * бы переход на страницу входа при каждой загрузке.
 */
const apiFetchSilent = ofetch.create(common);

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Не сообщать модели сессии про 401 — нужно для самой проверки сессии. */
  silentUnauthorized?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const client = options.silentUnauthorized ? apiFetchSilent : apiFetch;

  try {
    return await client<T>(path, {
      method: options.method ?? 'GET',
      body: options.body as Record<string, unknown> | undefined,
      // ofetch сам выбрасывает пустые значения из строки запроса.
      query: options.query,
    });
  } catch (error) {
    throw toApiError(error);
  }
}
