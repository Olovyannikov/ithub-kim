/**
 * Минимальный драйвер Chrome через DevTools Protocol.
 *
 * Зачем свой, а не Playwright: тот тянет собственные сборки браузеров на
 * сотни мегабайт, которые пришлось бы класть в офлайн-хранилище для площадки
 * ДЭ. Здесь используется уже установленный Chrome, а WebSocket встроен в
 * Node 22+ — ноль новых зависимостей.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const DEBUG_PORT = 9333;

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

  const profile = mkdtempSync(join(tmpdir(), 'kim-e2e-'));
  const chrome = spawn(
    binary,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      // Размер окна задаём явно: по умолчанию headless даёт 800x600, и
      // элементы с `visibleFrom="sm"` оказываются скрытыми. Для проверки
      // мобильного макета 390x844 (Задание 2) размер передаётся параметром.
      `--window-size=${width},${height}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const version = await waitForDebugger(DEBUG_PORT);
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

    async evaluate(expression) {
      const result = await call('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });

      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text ?? 'Ошибка в выражении');
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

    async clickByText(text) {
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
