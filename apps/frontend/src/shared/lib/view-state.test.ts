import { describe, expect, it } from 'vitest';

import { toListViewState } from './view-state';

describe('toListViewState', () => {
  it('пустой список во время загрузки — это загрузка', () => {
    expect(toListViewState({ pending: true, error: null, items: [] })).toEqual({
      kind: 'loading',
    });
  });

  it('данные показываются даже во время обновления — список не мигает', () => {
    expect(toListViewState({ pending: true, error: null, items: [1] })).toEqual({
      kind: 'list',
      items: [1],
    });
  });

  it('ошибка без данных — это ошибка', () => {
    expect(toListViewState({ pending: false, error: 'Сервер недоступен', items: [] })).toEqual({
      kind: 'error',
      message: 'Сервер недоступен',
    });
  });

  it('ни данных, ни ошибки, ни загрузки — пустота', () => {
    expect(toListViewState({ pending: false, error: null, items: [] })).toEqual({ kind: 'empty' });
  });

  it('одновременно загрузка и ошибка невозможны — состояние всегда одно', () => {
    const state = toListViewState({ pending: true, error: 'Ошибка', items: [] });

    expect(state.kind).toBe('loading');
  });
});
