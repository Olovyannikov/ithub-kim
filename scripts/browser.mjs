/**
 * Минимальный драйвер Chrome через DevTools Protocol.
 *
 * Зачем свой, а не Playwright: тот тянет собственные сборки браузеров на
 * сотни мегабайт, которые пришлось бы класть в офлайн-хранилище для площадки
 * ДЭ. Здесь используется уже установленный Chrome, а WebSocket встроен в
 * Node 22+ — ноль новых зависимостей.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

/**
 * Порт отладки выбирается свободный на каждый запуск.
 *
 * С фиксированным портом новый запуск молча присоединялся к Chrome,
 * оставшемуся от упавшего прошлого, и проверки шли в чужом, уже испорченном
 * браузере — ошибка выглядела как «поле не найдено».
 */
async function freePort() {
  const { createServer } = await import('node:net');

  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDebugger(port, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Браузер ещё не поднялся.
    }

    await sleep(200);
  }

  throw new Error('Chrome не открыл порт отладки');
}

export async function launchBrowser({ chromePath, width = 1280, height = 900 } = {}) {
  const binary = chromePath ?? CHROME_PATHS.find((path) => existsSync(path));

  if (!binary) {
    throw new Error('Не найден Chrome. Укажите путь через CHROME_PATH');
  }

  const port = await freePort();
  const profile = mkdtempSync(join(tmpdir(), 'kim-e2e-'));
  const chrome = spawn(
    binary,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      // Размер окна задаём явно: по умолчанию headless даёт 800x600, и
      // элементы с `visibleFrom="sm"` оказываются скрытыми. Для проверки
      // мобильного макета 390x844 (Задание 2) размер передаётся параметром.
      `--window-size=${width},${height}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const version = await waitForDebugger(port);
  const socket = new WebSocket(version.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);

      if (message.error) {
        reject(new Error(`${message.error.message} (${JSON.stringify(message.error)})`));
      } else {
        resolve(message.result);
      }

      return;
    }

    const handlers = listeners.get(message.method);

    if (handlers) {
      for (const handler of handlers) {
        handler(message.params);
      }
    }
  });

  function send(method, params = {}, sessionId) {
    const id = nextId++;
    const payload = { id, method, params };

    if (sessionId) {
      payload.sessionId = sessionId;
    }

    socket.send(JSON.stringify(payload));

    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`Таймаут вызова ${method}`));
        }
      }, 30_000);
    });
  }

  function on(method, handler) {
    const handlers = listeners.get(method) ?? [];
    handlers.push(handler);
    listeners.set(method, handlers);
  }

  async function close() {
    try {
      socket.close();
    } catch {
      // уже закрыт
    }

    chrome.kill('SIGTERM');
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }

  return { send, on, close };
}

/** Открывает новую страницу и возвращает обёртку над ней. */
export async function openPage(browser) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });

  const call = (method, params) => browser.send(method, params, sessionId);

  await call('Page.enable');
  await call('Runtime.enable');

  return {
    sessionId,
    call,

    /**
     * Точный размер экрана через эмуляцию устройства.
     *
     * Через `--window-size` добиться 390 px нельзя: окно Chrome не становится
     * уже примерно 500 px. А Задание 2 требует макет ровно 390×844, поэтому
     * проверять надо эмуляцией, а не размером окна.
     */
    /**
     * Журнал обращений к сети средствами протокола, а не подменой `fetch`.
     *
     * Подмена `window.fetch` не переживает переход на другую страницу, и
     * счётчик молча обнуляется. Для замеров производительности это ровно та
     * ошибка, из-за которой «всё хорошо» на бумаге.
     */
    async startNetworkLog() {
      this.networkLog = [];
      browser.on('Network.requestWillBeSent', (params) => {
        this.networkLog.push(params.request.url);
      });
      await call('Network.enable');
    },

    networkLog: [],

    /** Запросы к нашему API; можно сузить по подстроке пути. */
    apiCalls(filter = '') {
      return this.networkLog.filter((url) => url.includes('/api/') && url.includes(filter));
    },

    resetNetworkLog() {
      this.networkLog = [];
    },

    async setViewport({ width, height, deviceScaleFactor = 2, mobile = true }) {
      await call('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor,
        mobile,
        screenWidth: width,
        screenHeight: height,
      });

      if (mobile) {
        await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      }
    },

    async goto(url) {
      await call('Page.navigate', { url });
      await sleep(200);
      await this.waitForIdle();
    },

    /** Ждём, пока в DOM появится что-то кроме пустого контейнера. */
    async waitForIdle(timeoutMs = 10_000) {
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        const text = await this.text();

        if (text.trim().length > 0) {
          return;
        }

        await sleep(150);
      }
    },

    /**
     * Ждёт, пока выражение вернёт истину.
     *
     * Без этого помощники искали элемент ровно один раз и падали, если React
     * ещё не дорисовал страницу. Проверки становились нестабильными — а это
     * хуже явной поломки: к падающим через раз проверкам привыкают и
     * перестают их читать.
     */
    async waitUntil(expression, timeoutMs = 8000) {
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        if (await this.evaluate(expression)) {
          return true;
        }

        await sleep(120);
      }

      return false;
    },

    async evaluate(expression) {
      const result = await call('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });

      if (result.exceptionDetails) {
        const details = result.exceptionDetails;
        // В `text` почти всегда лежит бесполезное «Uncaught» — настоящее
        // сообщение приходит в описании исключения.
        const message =
          details.exception?.description ??
          details.exception?.value ??
          details.text ??
          'Ошибка в выражении';

        throw new Error(String(message).split('\n')[0]);
      }

      return result.result.value;
    },

    text() {
      return this.evaluate('document.body ? document.body.innerText : ""');
    },

    url() {
      return this.evaluate('location.pathname');
    },

    /** Вводит значение в поле по подписи — так же, как это сделал бы человек. */
    async fillByLabel(label, value) {
      await this.waitUntil(`Array.from(document.querySelectorAll('label')).some(
        (l) => l.textContent.replace(/\\s*\\*$/, '').trim() === ${JSON.stringify(label)},
      )`);

      const ok = await this.evaluate(`(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const target = labels.find((l) => l.textContent.replace(/\\s*\\*$/, '').trim() === ${JSON.stringify(label)});
        if (!target) return false;
        const id = target.getAttribute('for');
        const input = id ? document.getElementById(id) : target.parentElement.querySelector('input');
        if (!input) return false;
        const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set;
        setter.call(input, ${JSON.stringify(value)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`);

      if (!ok) {
        throw new Error(`Не найдено поле с подписью «${label}»`);
      }
    },

    /**
     * Выбирает значение в Mantine Select: открывает список и щёлкает по
     * варианту. Именно так это делает пользователь — значение нельзя просто
     * записать в input, компонент его не примет.
     */
    async selectByLabel(label, optionText) {
      // Ждём не просто появления поля, а готовности: пока грузится справочник,
      // список отключён, и щелчок по нему ничего не открывает.
      await this.waitUntil(`(() => {
        const label = Array.from(document.querySelectorAll('label')).find(
          (l) => l.textContent.replace(/\\s*\\*$/, '').trim() === ${JSON.stringify(label)},
        );
        if (!label) return false;
        const input = document.getElementById(label.getAttribute('for'));
        return Boolean(input) && !input.disabled;
      })()`);

      const opened = await this.evaluate(`(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const target = labels.find((l) => l.textContent.replace(/\\s*\\*$/, '').trim() === ${JSON.stringify(label)});
        if (!target) return false;
        const id = target.getAttribute('for');
        const input = id ? document.getElementById(id) : null;
        if (!input) return false;
        input.focus();
        input.click();
        return true;
      })()`);

      if (!opened) {
        throw new Error(`Не найден список с подписью «${label}»`);
      }

      // Ждём, пока список раскроется: фиксированная пауза подводила, как
      // только страница стала загружаться отдельной частью сборки.
      await this.waitUntil(`Array.from(document.querySelectorAll('[role="option"]')).filter(
        (o) => o.getClientRects().length > 0,
      ).length > 0`);

      const picked = await this.evaluate(`(() => {
        // Mantine держит в DOM варианты всех списков сразу, поэтому ищем
        // только среди видимых: открыт ровно один список.
        const options = Array.from(document.querySelectorAll('[role="option"]'))
          .filter((o) => o.getClientRects().length > 0);
        const target = options.find((o) => o.textContent.includes(${JSON.stringify(optionText)}));
        if (!target) return options.length === 0 ? 'closed' : 'missing';
        target.click();
        return 'ok';
      })()`);

      if (picked !== 'ok') {
        throw new Error(
          picked === 'closed'
            ? `Список «${label}» не открылся`
            : `В открытом списке «${label}» нет варианта «${optionText}»`,
        );
      }

      await sleep(250);
    },

    /** То же, но список найден по placeholder — для полей без тега label. */
    async selectByPlaceholder(placeholder, optionText) {
      await this.waitUntil(
        `Boolean(document.querySelector('input[placeholder=' + JSON.stringify(${JSON.stringify(placeholder)}) + ']'))`,
      );

      const opened = await this.evaluate(`(() => {
        const input = document.querySelector('input[placeholder=' + JSON.stringify(${JSON.stringify(placeholder)}) + ']');
        if (!input) return false;
        input.focus();
        input.click();
        return true;
      })()`);

      if (!opened) {
        throw new Error(`Не найден список с placeholder «${placeholder}»`);
      }

      await this.waitUntil(`Array.from(document.querySelectorAll('[role="option"]')).filter(
        (o) => o.getClientRects().length > 0,
      ).length > 0`);

      const picked = await this.evaluate(`(() => {
        const options = Array.from(document.querySelectorAll('[role="option"]'))
          .filter((o) => o.getClientRects().length > 0);
        const target = options.find((o) => o.textContent.trim() === ${JSON.stringify(optionText)});
        if (!target) return options.length === 0 ? 'closed' : 'missing';
        target.click();
        return 'ok';
      })()`);

      if (picked !== 'ok') {
        throw new Error(
          picked === 'closed'
            ? `Список «${placeholder}» не открылся`
            : `В открытом списке «${placeholder}» нет варианта «${optionText}»`,
        );
      }

      await sleep(600);
    },

    async clickByText(text) {
      await this.waitUntil(`Array.from(document.querySelectorAll('button, a')).some(
        (n) => n.textContent.trim() === ${JSON.stringify(text)},
      )`);

      const ok = await this.evaluate(`(() => {
        const nodes = Array.from(document.querySelectorAll('button, a'));
        const target = nodes.find((n) => n.textContent.trim() === ${JSON.stringify(text)});
        if (!target) return false;
        target.click();
        return true;
      })()`);

      if (!ok) {
        throw new Error(`Не найден элемент с текстом «${text}»`);
      }

      await sleep(600);
    },

    /** Снимок страницы целиком — для визуальной проверки и для Части 5. */
    async screenshot(path, { fullPage = true } = {}) {
      const { data } = await call('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: fullPage,
      });

      writeFileSync(path, Buffer.from(data, 'base64'));

      return path;
    },

    /**
     * Щелчок по элементу с заданным `aria-label`.
     *
     * Нужен для кнопок-иконок: на широком экране выход оформлен значком, и по
     * тексту его не найти. Ищем среди видимых, иначе попадём в пункт
     * свёрнутого мобильного меню.
     */
    async clickByLabel(label) {
      await this.waitUntil(`Array.from(
        document.querySelectorAll('[aria-label=' + JSON.stringify(${JSON.stringify(label)}) + ']'),
      ).some((n) => n.getClientRects().length > 0)`);

      const ok = await this.evaluate(`(() => {
        const nodes = Array.from(
          document.querySelectorAll('[aria-label=' + JSON.stringify(${JSON.stringify(label)}) + ']'),
        ).filter((n) => n.getClientRects().length > 0);
        if (nodes.length === 0) return false;
        nodes[0].click();
        return true;
      })()`);

      if (!ok) {
        throw new Error(`Не найден видимый элемент с подписью «${label}»`);
      }

      await sleep(600);
    },

    /**
     * Выбирает дату и время в календаре Mantine.
     *
     * Раньше поле было нативным `datetime-local`, и значение просто
     * записывалось в input. `DateTimePicker` — это кнопка с выпадающим
     * календарём, значение ей не присвоить: нужно открыть, долистать до
     * нужного месяца, щёлкнуть по дню и подтвердить. Время подставляется
     * из `defaultTimeValue`.
     */
    async pickDateByLabel(label, date) {
      const MONTHS = [
        'января',
        'февраля',
        'марта',
        'апреля',
        'мая',
        'июня',
        'июля',
        'августа',
        'сентября',
        'октября',
        'ноября',
        'декабря',
      ];
      // Так подписывает дни сам Mantine: dayjs формата «D MMMM YYYY» с русской локалью.
      const dayLabel = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

      await this.waitUntil(`Array.from(document.querySelectorAll('label')).some(
        (l) => l.textContent.replace(/\\s*\\*$/, '').trim() === ${JSON.stringify(label)},
      )`);

      const opened = await this.evaluate(`(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const target = labels.find((l) => l.textContent.replace(/\\s*\\*$/, '').trim() === ${JSON.stringify(label)});
        if (!target) return false;
        const id = target.getAttribute('for');
        const control = id ? document.getElementById(id) : null;
        if (!control) return false;
        control.click();
        return true;
      })()`);

      if (!opened) {
        throw new Error(`Не найдено поле даты с подписью «${label}»`);
      }

      await sleep(400);

      // Календарь открывается на текущем месяце — листаем вперёд, пока не
      // покажется нужный день. Двенадцати шагов хватает на год вперёд.
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const found = await this.evaluate(`(() => {
          const day = document.querySelector('[aria-label=' + JSON.stringify(${JSON.stringify('')} + ${JSON.stringify(dayLabel)}) + ']');
          if (!day || day.hasAttribute('data-disabled')) return false;
          day.click();
          return true;
        })()`);

        if (found) {
          await sleep(300);

          const submitted = await this.evaluate(`(() => {
            const button = document.querySelector('[aria-label="Подтвердить дату и время"]');
            if (!button) return false;
            button.click();
            return true;
          })()`);

          if (!submitted) {
            throw new Error('Не найдена кнопка подтверждения даты');
          }

          await sleep(400);
          return;
        }

        const moved = await this.evaluate(`(() => {
          const next = document.querySelector('[aria-label="Следующий месяц"]');
          if (!next || next.disabled) return false;
          next.click();
          return true;
        })()`);

        if (!moved) {
          break;
        }

        await sleep(250);
      }

      throw new Error(`В календаре не нашлось дня «${dayLabel}»`);
    },

    /**
     * Виден ли элемент с таким текстом **в пределах экрана**.
     *
     * Проверять по innerText нельзя: свёрнутая панель Mantine остаётся в DOM
     * и просто уезжает за границу окна, а скрытые через `visibleFrom` узлы,
     * наоборот, из innerText пропадают. Здесь важно именно то, что видит
     * пользователь.
     */
    async isVisibleByText(text) {
      return this.evaluate(`(() => {
        const nodes = Array.from(document.querySelectorAll('button, a')).filter(
          (n) => n.textContent.trim() === ${JSON.stringify(text)},
        );
        return nodes.some((n) => {
          const r = n.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            r.left >= 0 &&
            r.top >= 0 &&
            r.right <= window.innerWidth
          );
        });
      })()`);
    },

    /** Кнопка «назад» браузера. */
    async goBack() {
      await this.evaluate('history.back()');
      await sleep(700);
    },

    /** Кнопка «вперёд» браузера. */
    async goForward() {
      await this.evaluate('history.forward()');
      await sleep(700);
    },

    async waitForText(needle, timeoutMs = 10_000) {
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        const text = await this.text();

        if (text.includes(needle)) {
          return true;
        }

        await sleep(200);
      }

      return false;
    },
  };
}
