import type { RouterAdapter } from '@effector/router';
import { flushSync } from 'react-dom';

/**
 * Плавные переходы между страницами через View Transitions API.
 *
 * Почему обёрнут адаптер истории, а не компоненты. React 19 умеет
 * `<ViewTransition>`, но запускает его только для обновлений внутри
 * `startTransition`. Состояние роутера живёт в Effector и приезжает в React
 * через `useSyncExternalStore` — такое обновление пометить как transition
 * нельзя. Адаптер же — единственная точка, через которую проходит **любая**
 * навигация: и щелчок по ссылке, и программный переход после входа, и
 * редирект охранника маршрутов.
 *
 * `flushSync` здесь обязателен: `document.startViewTransition` снимает новый
 * кадр сразу после колбэка, а React по умолчанию отложил бы рендер на
 * следующий тик — анимация получилась бы между двумя одинаковыми кадрами.
 *
 * Чего обёртка не покрывает: кнопки «назад» и «вперёд» самого браузера —
 * такой переход приходит в адаптер уведомлением, а не командой.
 */

/** Переходы отключаются, если человек попросил уменьшить движение. */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function supported(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

function animated<T extends unknown[]>(command: (...args: T) => void) {
  return (...args: T): void => {
    if (!supported() || prefersReducedMotion()) {
      command(...args);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        command(...args);
      });
    });
  };
}

export function withViewTransitions(adapter: RouterAdapter): RouterAdapter {
  // Наследование, а не копирование: `location` у адаптера — живое значение,
  // и спред заморозил бы его на состоянии в момент создания.
  return Object.assign(Object.create(adapter) as RouterAdapter, {
    push: animated(adapter.push.bind(adapter)),
    replace: animated(adapter.replace.bind(adapter)),
    goBack: animated(adapter.goBack.bind(adapter)),
    goForward: animated(adapter.goForward.bind(adapter)),
  });
}
