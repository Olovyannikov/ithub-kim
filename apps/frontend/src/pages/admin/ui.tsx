import type { ApplicationStatus } from '@kim/shared';
import {
  Alert,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconCalendarEvent, IconFilterOff, IconSearch } from '@tabler/icons-react';
import { useUnit } from 'effector-react';
import { match } from 'ts-pattern';

import { ApplicationCard } from '../../entities/application';
import { plural } from '../../shared/lib';
import { AdminPageModel, ASSIGNABLE_STATUS_OPTIONS, STATUS_OPTIONS } from './model';

/** Задание 1, п. 5 и Задание 2, п. 5: панель администратора. */
export function AdminPage() {
  const {
    viewState,
    total,
    filters,
    page,
    pageCount,
    hasFilters,
    updatingId,
    roomOptions,
    changeFilters,
    resetFilters,
    changePage,
    changeStatus,
  } = useUnit(AdminPageModel.viewModel);

  return (
    <Stack gap="lg">
      <Stack gap={2}>
        <Title order={1}>Панель администратора</Title>
        <Text c="dimmed">
          {total} {plural(total, ['заявка', 'заявки', 'заявок'])} от зарегистрированных
          пользователей
        </Text>
      </Stack>

      {/* Задание 2, п. 5: «фильтрация данных заявок пользователей». */}
      <Card withBorder padding="md" bg="white">
        <Stack gap="sm">
          <Grid gap="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Статус"
                placeholder="Любой"
                data={STATUS_OPTIONS}
                clearable
                value={filters.status}
                onChange={(value) =>
                  changeFilters({ ...filters, status: value as ApplicationStatus | null })
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Помещение"
                placeholder="Любое"
                data={roomOptions}
                searchable
                clearable
                value={filters.roomId}
                onChange={(value) => changeFilters({ ...filters, roomId: value })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                label="Заявитель"
                placeholder="Логин или ФИО"
                leftSection={<IconSearch size={18} stroke={1.8} />}
                value={filters.author}
                onChange={(event) =>
                  changeFilters({ ...filters, author: event.currentTarget.value })
                }
              />
            </Grid.Col>
            {/*
              Границы диапазона — тот же календарь Mantine, что и на форме
              заявки: нативный `datetime-local` выглядел чужеродно и в каждом
              браузере по-своему.
            */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DateTimePicker
                label="Начало конференции: с"
                placeholder="Любая дата"
                maxDate={filters.to || undefined}
                valueFormat="D MMMM YYYY, HH:mm"
                // Кнопки календаря Mantine по умолчанию без подписи — для
                // скринридера это «кнопка» без смысла. Подписываем.
                nextLabel="Следующий месяц"
                previousLabel="Предыдущий месяц"
                submitButtonProps={{ 'aria-label': 'Подтвердить дату и время' }}
                leftSection={<IconCalendarEvent size={18} stroke={1.8} />}
                clearable
                value={filters.from || null}
                onChange={(value) => changeFilters({ ...filters, from: value ?? '' })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DateTimePicker
                label="по"
                placeholder="Любая дата"
                minDate={filters.from || undefined}
                valueFormat="D MMMM YYYY, HH:mm"
                // Кнопки календаря Mantine по умолчанию без подписи — для
                // скринридера это «кнопка» без смысла. Подписываем.
                nextLabel="Следующий месяц"
                previousLabel="Предыдущий месяц"
                submitButtonProps={{ 'aria-label': 'Подтвердить дату и время' }}
                leftSection={<IconCalendarEvent size={18} stroke={1.8} />}
                clearable
                value={filters.to || null}
                onChange={(value) => changeFilters({ ...filters, to: value ?? '' })}
              />
            </Grid.Col>
          </Grid>

          {hasFilters ? (
            <Group justify="flex-end">
              <Button
                variant="subtle"
                leftSection={<IconFilterOff size={18} stroke={1.8} />}
                onClick={() => resetFilters()}
              >
                Сбросить фильтры
              </Button>
            </Group>
          ) : null}
        </Stack>
      </Card>

      {match(viewState)
        .with({ kind: 'loading' }, () => (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ))
        .with({ kind: 'error' }, ({ message }) => (
          <Alert color="red" variant="light">
            {message}
          </Alert>
        ))
        .with({ kind: 'empty' }, () => (
          <Card withBorder padding="xl" bg="white">
            <Text c="dimmed">
              {hasFilters
                ? 'По выбранным фильтрам заявок не нашлось.'
                : 'Заявок от пользователей пока нет.'}
            </Text>
          </Card>
        ))
        .with({ kind: 'list' }, ({ items }) => (
          <Stack gap="md">
            {items.map((application, index) => (
              <ApplicationCard
                key={application.id}
                application={application}
                withAuthor
                eagerImage={index === 0}
                interactive
                actions={
                  // Задание 1, п. 5: администратор меняет статус на
                  // «Мероприятие назначено» или «Завершено». Статус «Новая»
                  // вручную не ставится.
                  <Select
                    aria-label={`Статус заявки №${application.id}`}
                    placeholder="Сменить статус"
                    data={ASSIGNABLE_STATUS_OPTIONS}
                    value={null}
                    disabled={updatingId === application.id}
                    w={240}
                    onChange={(value) => {
                      if (value) {
                        changeStatus({ id: application.id, status: value as ApplicationStatus });
                      }
                    }}
                  />
                }
              />
            ))}
          </Stack>
        ))
        .exhaustive()}

      {pageCount > 1 ? (
        <Group justify="center">
          <Pagination value={page} onChange={(value) => changePage(value)} total={pageCount} />
        </Group>
      ) : null}
    </Stack>
  );
}
