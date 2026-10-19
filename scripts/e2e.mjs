/**
 * Сквозная проверка Задания 1 в настоящем браузере.
 *
 * Проверяет то, что нельзя проверить ни модульным тестом, ни запросом curl:
 * формы, переходы, защиту маршрутов и поведение вошедшего пользователя.
 *
 * Требуется запущенный стек: `pnpm dev` (или собранный бэкенд и Vite).
 *   pnpm e2e
 */
import assert from 'node:assert/strict';

import { launchBrowser, openPage } from './browser.mjs';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const ADMIN = { login: 'Conf2027', password: 'Demo77' };

const checks = [];

function check(name, fn) {
  checks.push({ name, fn });
}

check('гостя с защищённого маршрута уводит на вход', async (page) => {
  await page.goto(`${BASE}/applications`);

  const text = await page.text();
  assert.ok(text.includes('Вход'), 'ожидалась форма входа');
  assert.ok(
    text.includes('Еще не зарегистрированы? Регистрация'),
    'текст ссылки должен совпадать с ТЗ дословно',
  );
});

check('переход между входом и регистрацией работает в обе стороны', async (page) => {
  await page.goto(`${BASE}/login`);
  await page.clickByText('Еще не зарегистрированы? Регистрация');

  assert.equal(await page.url(), '/register');
  assert.ok((await page.text()).includes('Создать пользователя'));

  await page.clickByText('Уже зарегистрированы? Вход');
  assert.equal(await page.url(), '/login');
});

check('ошибки валидации показываются на форме регистрации', async (page) => {
  await page.goto(`${BASE}/register`);

  await page.fillByLabel('Логин', 'ab');
  await page.fillByLabel('Пароль', '123');
  await page.fillByLabel('ФИО', 'Ivanov Ivan');
  // Поле под маской: ввести «+7…» или буквы оно не даст, поэтому проверяем
  // то, что действительно может случиться, — недописанный номер.
  await page.fillByLabel('Телефон', '8999');
  await page.fillByLabel('Электронная почта', 'не-почта');
  await page.clickByText('Создать пользователя');

  const text = await page.text();

  for (const expected of [
    'Логин: латиница и цифры, не менее 6 символов',
    'Пароль: минимум 8 символов',
    'ФИО: только символы кириллицы и пробелы',
    'Телефон в формате 8(XXX)XXX-XX-XX',
    'Некорректный адрес электронной почты',
  ]) {
    assert.ok(text.includes(expected), `на форме нет сообщения «${expected}»`);
  }

  assert.equal(await page.url(), '/register', 'с ошибками регистрация не должна проходить');
});

check('неверные учётные данные показываются на форме входа', async (page) => {
  await page.goto(`${BASE}/login`);

  await page.fillByLabel('Логин', 'нетакогологина');
  await page.fillByLabel('Пароль', 'НеверныйПароль1');
  await page.clickByText('Войти');

  assert.ok(
    await page.waitForText('Неверный логин или пароль'),
    'сообщение сервера должно оказаться на форме',
  );
});

check('администратор входит по учётным данным из ТЗ и видит свою панель', async (page) => {
  await page.goto(`${BASE}/login`);

  await page.fillByLabel('Логин', ADMIN.login);
  await page.fillByLabel('Пароль', ADMIN.password);
  await page.clickByText('Войти');

  assert.ok(await page.waitForText('Мои заявки'), 'после входа ожидался список заявок');
  assert.equal(await page.url(), '/applications');

  const text = await page.text();
  assert.ok(text.includes('Панель администратора'), 'админу должна быть видна его панель');
  assert.ok(text.includes('Администратор'), 'в шапке ожидалась отметка роли');
});

check('вошедший пользователь не остаётся на странице входа', async (page) => {
  await page.goto(`${BASE}/login`);

  assert.equal(await page.url(), '/applications', 'вошедшего должно уводить со страницы входа');
});

check('выход возвращает на страницу входа и закрывает доступ', async (page) => {
  await page.goto(`${BASE}/applications`);
  await page.clickByLabel('Выйти');

  assert.ok(await page.waitForText('Вход'), 'после выхода ожидалась форма входа');

  await page.goto(`${BASE}/admin`);
  assert.ok((await page.text()).includes('Вход'), 'после выхода админка должна быть закрыта');
});

// --- Сквозной сценарий Задания 1 целиком ---

/** Логин уникален в каждом запуске: регистрация не должна упираться в занятый логин. */
const RUN_ID = String(Date.now()).slice(-7);
const USER = {
  login: `demo${RUN_ID}`,
  password: 'DemoPass2027',
  fullName: 'Петров Пётр Петрович',
  phone: '8(999)100-20-30',
  email: `demo${RUN_ID}@example.ru`,
};

const ROOM = 'Кинозал «Премьера»';
const PAYMENT = 'Переводом по системе СБП';

/** Дата начала конференции: время подставит сам календарь из defaultTimeValue. */
function startsAtDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(10, 0, 0, 0);

  return date;
}

async function logout(page) {
  await page.goto(`${BASE}/applications`);

  // Если защищённый маршрут увёл на вход — пользователь уже вышел.
  if ((await page.url()) === '/login') {
    return;
  }

  // На широком экране выход оформлен кнопкой-иконкой, поэтому ищем по подписи
  // для экранных дикторов, а не по тексту.
  await page.clickByLabel('Выйти');
  await page.waitForText('Вход');
}

check('полный сценарий: регистрация, заявка, смена статуса админом, отзыв', async (page) => {
  await logout(page);

  // 1. Регистрация нового пользователя — Задание 1, п. 1.
  await page.goto(`${BASE}/register`);
  await page.fillByLabel('Логин', USER.login);
  await page.fillByLabel('Пароль', USER.password);
  await page.fillByLabel('ФИО', USER.fullName);
  await page.fillByLabel('Телефон', USER.phone);
  await page.fillByLabel('Электронная почта', USER.email);
  await page.clickByText('Создать пользователя');

  assert.ok(await page.waitForText('Мои заявки'), 'после регистрации ожидался список заявок');
  assert.ok((await page.text()).includes('Заявок пока нет'), 'у нового пользователя заявок нет');

  // 2. Формирование заявки — Задание 1, п. 4, с выпадающими списками из Задания 2.
  await page.clickByText('Сформировать заявку');
  assert.equal(await page.url(), '/applications/new');

  await page.selectByLabel('Помещение', ROOM);
  await page.pickDateByLabel('Начало конференции', startsAtDate(30));
  await page.selectByLabel('Способ оплаты', PAYMENT);
  await page.clickByText('Отправить');

  assert.ok(await page.waitForText(ROOM), 'заявка должна появиться в списке своих заявок');

  const afterCreate = await page.text();
  assert.ok(afterCreate.includes('Новая'), 'заявка создаётся со статусом «Новая»');
  assert.ok(afterCreate.includes(PAYMENT), 'способ оплаты должен быть виден');
  assert.ok(
    !afterCreate.includes('Оставить отзыв'),
    'до завершения мероприятия отзыв оставить нельзя',
  );

  // 3. Администратор видит заявку и переводит её в «Завершено» — Задание 1, п. 5.
  await logout(page);
  await page.goto(`${BASE}/login`);
  await page.fillByLabel('Логин', ADMIN.login);
  await page.fillByLabel('Пароль', ADMIN.password);
  await page.clickByText('Войти');
  await page.waitForText('Мои заявки');

  await page.goto(`${BASE}/admin`);
  assert.ok(await page.waitForText('Панель администратора'), 'ожидалась панель администратора');

  // Фильтр по заявителю — Задание 2, п. 5.
  await page.fillByLabel('Заявитель', USER.login);
  assert.ok(await page.waitForText(USER.fullName), 'фильтр по заявителю должен найти заявку');

  const filtered = await page.text();
  assert.ok(filtered.includes(ROOM), 'в отфильтрованной выдаче ожидалась наша заявка');
  assert.ok(filtered.includes(USER.email), 'админу видны контакты заявителя');

  // Селект статуса в карточке подписан через aria-label, поэтому ищем его по placeholder.
  await page.selectByPlaceholder('Сменить статус', 'Завершено');
  assert.ok(await page.waitForText('Завершено'), 'статус должен обновиться без перезагрузки');

  // 4. Пользователь оставляет отзыв — Задание 1, п. 3 и Задание 2, п. 3.
  await logout(page);
  await page.goto(`${BASE}/login`);
  await page.fillByLabel('Логин', USER.login);
  await page.fillByLabel('Пароль', USER.password);
  await page.clickByText('Войти');
  await page.waitForText(ROOM);

  const beforeReview = await page.text();
  assert.ok(beforeReview.includes('Завершено'), 'пользователь видит новый статус');
  assert.ok(
    beforeReview.includes('Оставить отзыв'),
    'после завершения мероприятия отзыв должен стать доступен',
  );

  await page.clickByText('Оставить отзыв');
  assert.ok(await page.waitForText('Отзыв о мероприятии'), 'ожидалась форма отзыва');

  await page.fillByLabel('Текст отзыва', 'Зал и оборудование отработали без нареканий.');
  await page.clickByText('Отправить отзыв');

  assert.ok(
    await page.waitForText('Зал и оборудование отработали без нареканий.'),
    'отзыв должен появиться в карточке заявки',
  );

  const afterReview = await page.text();
  assert.ok(afterReview.includes('оценка 5 из 5'), 'оценка должна быть видна');
  assert.ok(
    !afterReview.includes('Оставить отзыв'),
    'второй отзыв об одном мероприятии оставить нельзя',
  );
});

check('кнопки «назад» и «вперёд» браузера переключают страницы', async (page) => {
  /*
    Проверка появилась после настоящего отказа. Адаптер истории отдавал роутеру
    перехват нативных переходов, и тот зацикливался: `pop → go(1) → retry →
    go(-1) → pop` без конца. Адрес метался между двумя страницами, а экран не
    менялся вовсе. Ни один из прежних сценариев этого не ловил — все они ходили
    только по ссылкам.
  */
  // Проверки идут по одной странице подряд, поэтому начинаем с чистого листа.
  await logout(page);
  await page.goto(`${BASE}/login`);
  await page.fillByLabel('Логин', ADMIN.login);
  await page.fillByLabel('Пароль', ADMIN.password);
  await page.clickByText('Войти');
  await page.waitForText('Мои заявки');

  await page.clickByText('Новая заявка');
  assert.equal(await page.url(), '/applications/new');

  await page.goBack();
  assert.equal(await page.url(), '/applications', 'после «назад» ожидался список заявок');
  assert.ok(
    (await page.text()).includes('Мои заявки'),
    'после «назад» на экране должна быть страница, которой соответствует адрес',
  );

  await page.goForward();
  assert.equal(await page.url(), '/applications/new', 'после «вперёд» ожидалась форма заявки');
  assert.ok(await page.waitForText('Выберите помещение'), 'форма заявки должна отрисоваться');
});

check('мобильный макет 390x844: меню сворачивается и работает', async (page) => {
  await logout(page);
  // Размер из Задания 2. Через размер окна его не добиться — окно Chrome не
  // становится уже примерно 500 px, поэтому включаем эмуляцию устройства.
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  try {
    await page.goto(`${BASE}/login`);
    await page.fillByLabel('Логин', ADMIN.login);
    await page.fillByLabel('Пароль', ADMIN.password);
    await page.clickByText('Войти');
    assert.ok(await page.waitForText('Мои заявки'), 'вход должен работать и на телефоне');

    const width = await page.evaluate('window.innerWidth');
    assert.equal(width, 390, 'ширина экрана должна быть ровно 390');

    // Страница не должна уезжать вбок: горизонтальной прокрутки быть не может.
    const overflow = await page.evaluate(
      'document.documentElement.scrollWidth - document.documentElement.clientWidth',
    );
    assert.ok(overflow <= 0, `появилась горизонтальная прокрутка: ${overflow} px`);

    // Навигация свёрнута в меню: пункт есть в разметке, но не виден на экране.
    assert.equal(
      await page.isVisibleByText('Панель администратора'),
      false,
      'на узком экране пункты меню не должны быть видны до нажатия на бургер',
    );

    await page.clickByLabel('Меню');
    assert.equal(
      await page.isVisibleByText('Панель администратора'),
      true,
      'после нажатия на бургер пункт меню должен стать виден',
    );
  } finally {
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  }
});

async function main() {
  const browser = await launchBrowser({
    chromePath: process.env.CHROME_PATH,
    width: Number(process.env.E2E_WIDTH ?? 1280),
    height: Number(process.env.E2E_HEIGHT ?? 900),
  });
  const page = await openPage(browser);

  let failed = 0;

  for (const { name, fn } of checks) {
    try {
      await fn(page);
      console.log(`  ✔ ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`  ✖ ${name}`);
      console.error(`      ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await browser.close();

  console.log(`\nпроверок: ${checks.length}, провалено: ${failed}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

await main();
