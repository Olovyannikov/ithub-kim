import type {
  ApplicationDto,
  ApplicationsPage,
  PaymentMethod,
  RoomDto,
  UserDto,
} from '@kim/shared';

import { request } from './client';

/**
 * Обёртки над эндпоинтами. Описаны в одном месте, чтобы пути существовали в
 * единственном экземпляре — контракт зафиксирован в docs/api.
 */
export const authApi = {
  register: (body: {
    login: string;
    password: string;
    fullName: string;
    phone: string;
    email: string;
  }) => request<UserDto>('/auth/register', { method: 'POST', body }),

  login: (body: { login: string; password: string }) =>
    request<UserDto>('/auth/login', { method: 'POST', body }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  /** 401 здесь — нормальный ответ «не вошёл», а не истёкшая сессия. */
  me: () => request<UserDto>('/auth/me', { silentUnauthorized: true }),
};

export const roomsApi = {
  list: () => request<RoomDto[]>('/rooms'),
};

export const applicationsApi = {
  create: (body: { roomId: number; startsAt: string; paymentMethod: PaymentMethod }) =>
    request<ApplicationDto>('/applications', { method: 'POST', body }),

  mine: () => request<ApplicationDto[]>('/applications/my'),

  addReview: (applicationId: number, body: { rating: number; text: string }) =>
    request<ApplicationDto>(`/applications/${applicationId}/review`, { method: 'POST', body }),

  all: (query: {
    status?: string;
    roomId?: number;
    author?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) => request<ApplicationsPage>('/applications', { query }),

  updateStatus: (applicationId: number, body: { status: string }) =>
    request<ApplicationDto>(`/applications/${applicationId}/status`, { method: 'PATCH', body }),
};
