import { ApiError } from '../api';

/**
 * Ошибка сервера, разложенная для показа на форме.
 *
 * `fields` — сообщения по именам полей, `message` — то, что не привязалось ни
 * к одному полю и показывается общим блоком над формой.
 */
export interface ServerErrors {
  fields: Record<string, string>;
  message: string | null;
}

export const NO_SERVER_ERRORS: ServerErrors = { fields: {}, message: null };

/**
 * Разбирает ошибку в вид, пригодный для формы.
 *
 * Функция чистая и живёт в модели, а не в компоненте: раскладывать ошибки
 * через `form.setErrors` в `useEffect` означало бы зеркалить состояние
 * Effector в состояние React — лишний цикл рендера и логика в компоненте,
 * чего ADR-0006 как раз велит избегать. Компонент просто передаёт нужное
 * сообщение в `error` поля.
 */
export function parseServerError(error: unknown): ServerErrors {
  if (error === null || error === undefined) {
    return NO_SERVER_ERRORS;
  }

  if (!(error instanceof ApiError)) {
    return { fields: {}, message: 'Непредвиденная ошибка. Попробуйте повторить' };
  }

  const fields = error.fieldErrors;

  return Object.keys(fields).length > 0
    ? { fields, message: null }
    : { fields: {}, message: error.message };
}
