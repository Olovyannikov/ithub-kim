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
  await page.fillByLabel('Телефон', '89991234567');
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
  await page.clickByText('Выйти');

  assert.ok(await page.waitForText('Вход'), 'после выхода ожидалась форма входа');

  await page.goto(`${BASE}/admin`);
  assert.ok((await page.text()).includes('Вход'), 'после выхода админка должна быть закрыта');
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
