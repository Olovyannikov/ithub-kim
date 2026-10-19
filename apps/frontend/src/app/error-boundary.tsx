import { Button, Code, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { Component, type ErrorInfo, type PropsWithChildren } from 'react';

import { StatusScreen } from '../shared/ui';

interface State {
  error: Error | null;
  detailsOpen: boolean;
}

/**
 * Граница ошибок — экран 500.
 *
 * Без неё исключение при отрисовке оставляет пустой белый экран: React
 * размонтирует всё дерево и ничего не показывает взамен. На защите это худший
 * из возможных видов — непонятно даже, работает ли приложение.
 *
 * Написана классом не по старой памяти: ловить ошибки отрисовки умеют только
 * классовые компоненты, хука для этого в React нет до сих пор.
 *
 * Текст ошибки убран под раскрывающийся блок: пользователю он не нужен, а
 * тому, кто будет разбираться, — нужен сразу, без консоли.
 */
export class ErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { error: null, detailsOpen: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Консоль — единственное место, где это увидит разработчик: сервера для
    // сбора ошибок на площадке ДЭ нет и не будет.
    // eslint-disable-next-line no-console -- иначе след от ошибки теряется совсем
    console.error('Необработанная ошибка отрисовки:', error, info.componentStack);
  }

  private readonly reload = (): void => {
    // Именно перезагрузка, а не сброс состояния: после исключения состояние
    // приложения недостоверно, и продолжать с него — значит ловить вторую
    // ошибку вместо первой.
    window.location.reload();
  };

  private readonly toggleDetails = (): void => {
    this.setState((state) => ({ detailsOpen: !state.detailsOpen }));
  };

  override render() {
    const { error, detailsOpen } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <StatusScreen
        code="500"
        title="Что-то сломалось"
        description="Страницу не удалось отобразить. Обновите её — если ошибка повторится, сообщите о ней."
        actions={
          <Group gap="sm">
            <Button leftSection={<IconRefresh size={18} stroke={1.8} />} onClick={this.reload}>
              Обновить страницу
            </Button>
            <Button variant="subtle" onClick={this.toggleDetails}>
              {detailsOpen ? 'Скрыть подробности' : 'Подробности'}
            </Button>
          </Group>
        }
      >
        {detailsOpen ? (
          <Code block ta="left" w="100%">
            {error.message}
          </Code>
        ) : null}
      </StatusScreen>
    );
  }
}
