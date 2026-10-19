/**
 * Форматирование для интерфейса. Вся локализация в одном месте, чтобы даты и
 * числа не расходились между страницами.
 */
const DATE_TIME = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_ONLY = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return DATE_ONLY.format(new Date(iso));
}

/**
 * Значение для полей `@mantine/dates`.
 *
 * Mantine 9 работает с датами как со строками `YYYY-MM-DD HH:mm:ss` в местном
 * времени — не с `Date` и не с ISO. Формат без часового пояса здесь уместен:
 * пользователь выбирает время конференции по своим часам, а не по UTC.
 */
export function toPickerValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  const day = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
  const time = [pad(date.getHours()), pad(date.getMinutes()), '00'].join(':');

  return `${day} ${time}`;
}

/**
 * Обратное преобразование: из строки пикера в ISO для отправки на сервер.
 *
 * `new Date('2026-11-18 10:00:00')` разбирается как местное время — это ровно
 * то, что выбрал пользователь, — и `toISOString` переводит его в UTC.
 */
export function pickerValueToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Склонение существительного по числу: 1 заявка, 2 заявки, 5 заявок. */
export function plural(count: number, forms: [string, string, string]): string {
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;

  if (mod100 > 10 && mod100 < 20) {
    return forms[2];
  }

  if (mod10 === 1) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return forms[1];
  }

  return forms[2];
}
