/**
 * Форма ответа API с ошибками. Общая для фронтенда и бэкенда, чтобы клиент
 * раскладывал ошибки по полям формы одним и тем же кодом — и для ошибок
 * валидации, и для бизнес-правил (ADR-0005).
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  /** Ключ — имя поля формы, значение — одно сообщение для показа под полем. */
  errors?: Record<string, string>;
}

/** Пользователь в ответах API: без хеша пароля и прочего лишнего. */
export interface UserDto {
  id: number;
  login: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
}

/** Помещение в ответах API. */
export interface RoomDto {
  id: number;
  name: string;
  kind: string;
  capacity: number | null;
  description: string | null;
  imageUrl: string | null;
}

/** Отзыв в ответах API. */
export interface ReviewDto {
  id: number;
  rating: number;
  text: string;
  createdAt: string;
}

/** Заявка в ответах API. */
export interface ApplicationDto {
  id: number;
  room: RoomDto;
  startsAt: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  review: ReviewDto | null;
  /** Можно ли оставить отзыв — считается на сервере по статусу заявки. */
  canLeaveReview: boolean;
  /** Автор заявки. Заполняется только в выдаче для администратора. */
  author?: Pick<UserDto, 'id' | 'login' | 'fullName' | 'phone' | 'email'>;
}

/** Страница списка заявок. */
export interface ApplicationsPage {
  items: ApplicationDto[];
  total: number;
}
