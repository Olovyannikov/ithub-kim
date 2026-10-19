/**
 * Состояние списка как размеченное объединение.
 *
 * Раньше страницы рисовали четыре независимых условия: загрузка, ошибка,
 * пустота и сами данные. Так возможны невозможные сочетания (идёт загрузка и
 * одновременно показана ошибка), а решающая логика вида
 * `pending && items.length === 0` живёт в компоненте — вопреки правилу
 * «компонент не содержит логики» (ADR-0006).
 *
 * Объединение убирает и то и другое: состояние считается в модели, а компонент
 * просто сопоставляет вариант с разметкой.
 */
export type ListViewState<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'list'; items: T[] };

interface ListSource<T> {
  pending: boolean;
  error: string | null;
  items: T[];
}

export function toListViewState<T>({ pending, error, items }: ListSource<T>): ListViewState<T> {
  // Данные показываем даже во время обновления: при смене фильтров список не
  // должен мигать загрузчиком, если прошлые результаты ещё актуальны.
  if (items.length > 0) {
    return { kind: 'list', items };
  }

  if (pending) {
    return { kind: 'loading' };
  }

  if (error) {
    return { kind: 'error', message: error };
  }

  return { kind: 'empty' };
}
