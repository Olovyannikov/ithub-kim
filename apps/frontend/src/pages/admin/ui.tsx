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
import { IconFilterOff, IconSearch } from '@tabler/icons-react';
import { useUnit } from 'effector-react';

import { ApplicationCard } from '../../entities/application';
import { $roomOptions } from '../../entities/room';
import { plural } from '../../shared/lib';
import {
  $error,
  $filters,
  $isEmpty,
  $items,
  $page,
  $pageCount,
  $pending,
  $total,
  $updatingId,
  ASSIGNABLE_STATUS_OPTIONS,
  filtersChanged,
  filtersReset,
  pageChanged,
  statusChangeRequested,
  STATUS_OPTIONS,
} from './model';

/** Задание 1, п. 5 и Задание 2, п. 5: панель администратора. */
export function AdminPage() {
  const [
    items,
    total,
    filters,
    page,
    pageCount,
    pending,
    isEmpty,
    error,
    updatingId,
    roomOptions,
    changeFilters,
    resetFilters,
    changePage,
    changeStatus,
  ] = useUnit([
    $items,
    $total,
    $filters,
    $page,
    $pageCount,
    $pending,
    $isEmpty,
    $error,
    $updatingId,
    $roomOptions,
    filtersChanged,
    filtersReset,
    pageChanged,
    statusChangeRequested,
  ]);

  const hasFilters =
    filters.status !== null ||
    filters.roomId !== null ||
    filters.author !== '' ||
    filters.from !== '' ||
    filters.to !== '';

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
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                type="datetime-local"
                label="Начало конференции: с"
                value={filters.from}
                onChange={(event) => changeFilters({ ...filters, from: event.currentTarget.value })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                type="datetime-local"
                label="по"
                value={filters.to}
                onChange={(event) => changeFilters({ ...filters, to: event.currentTarget.value })}
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

      {error ? (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      ) : null}

      {pending && items.length === 0 ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : null}

      {isEmpty && !error ? (
        <Card withBorder padding="xl" bg="white">
          <Text c="dimmed">
            {hasFilters
              ? 'По выбранным фильтрам заявок не нашлось.'
              : 'Заявок от пользователей пока нет.'}
          </Text>
        </Card>
      ) : null}

      <Stack gap="md">
        {items.map((application, index) => (
          <ApplicationCard
            key={application.id}
            application={application}
            withAuthor
            eagerImage={index === 0}
            actions={
              // Задание 1, п. 5: администратор меняет статус на «Мероприятие
              // назначено» или «Завершено». Статус «Новая» вручную не ставится.
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

      {pageCount > 1 ? (
        <Group justify="center">
          <Pagination value={page} onChange={(value) => changePage(value)} total={pageCount} />
        </Group>
      ) : null}
    </Stack>
  );
}
