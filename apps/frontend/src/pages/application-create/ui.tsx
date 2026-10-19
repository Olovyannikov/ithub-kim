import { Alert, Button, Card, Group, Select, Stack, Text, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconBuilding, IconCalendarEvent, IconCreditCard, IconSend } from '@tabler/icons-react';
import { useUnit } from 'effector-react';

import { validators } from '../../shared/forms';
import { ApplicationCreatePageModel, PAYMENT_OPTIONS, type CreateValues } from './model';

/** Задание 1, п. 4: страница формирования заявки. */
export function ApplicationCreatePage() {
  const {
    roomOptions,
    roomsPending,
    minStartsAt,
    pending,
    serverErrors,
    submit,
    openApplications,
  } = useUnit(ApplicationCreatePageModel.viewModel);

  const form = useForm<CreateValues>({
    initialValues: { roomId: null, startsAt: null, paymentMethod: null },
    validate: {
      roomId: validators.room,
      startsAt: validators.startsAt,
      paymentMethod: validators.paymentMethod,
    },
    validateInputOnBlur: true,
  });

  return (
    <Card withBorder padding="xl" maw={620} mx="auto" bg="white">
      <form
        onSubmit={form.onSubmit((values) => {
          submit(values);
        })}
        noValidate
      >
        <Stack gap="md">
          <Stack gap={2}>
            <Title order={1}>Новая заявка</Title>
            <Text c="dimmed">
              Выберите помещение для конференции, укажите желаемое время начала и способ оплаты.
            </Text>
          </Stack>

          {serverErrors.message ? (
            <Alert color="red" variant="light">
              {serverErrors.message}
            </Alert>
          ) : null}

          {/*
            Задание 2, п. 4: «предложите пользователю выбрать опции из
            раскрывающегося списка» — вместо ручного ввода названия помещения.
          */}
          <Select
            label="Помещение"
            placeholder={roomsPending ? 'Загружаем справочник…' : 'Выберите помещение'}
            data={roomOptions}
            searchable
            disabled={roomsPending}
            leftSection={<IconBuilding size={18} stroke={1.8} />}
            withAsterisk
            {...form.getInputProps('roomId')}
            error={form.errors.roomId ?? serverErrors.fields.roomId}
          />

          {/*
            Календарь Mantine вместо браузерного `datetime-local`: нативный
            выглядит по-разному в каждом браузере и не подчиняется теме
            заказчика. Здесь же — русские месяцы, неделя с понедельника и
            оформление, общее с остальными полями.
          */}
          <DateTimePicker
            label="Начало конференции"
            placeholder="Выберите дату и время"
            minDate={minStartsAt}
            // Заявку подают на рабочее время, поэтому при выборе дня
            // подставляется десять утра, а не полночь.
            defaultTimeValue="10:00"
            valueFormat="D MMMM YYYY, HH:mm"
            // Кнопки календаря Mantine по умолчанию без подписи — для
            // скринридера это «кнопка» без смысла. Подписываем.
            nextLabel="Следующий месяц"
            previousLabel="Предыдущий месяц"
            submitButtonProps={{ 'aria-label': 'Подтвердить дату и время' }}
            leftSection={<IconCalendarEvent size={18} stroke={1.8} />}
            withAsterisk
            clearable
            {...form.getInputProps('startsAt')}
            error={form.errors.startsAt ?? serverErrors.fields.startsAt}
          />

          <Select
            label="Способ оплаты"
            placeholder="Выберите способ оплаты"
            data={PAYMENT_OPTIONS}
            leftSection={<IconCreditCard size={18} stroke={1.8} />}
            withAsterisk
            {...form.getInputProps('paymentMethod')}
            error={form.errors.paymentMethod ?? serverErrors.fields.paymentMethod}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => openApplications()}>
              Отмена
            </Button>
            {/* Текст кнопки задан ТЗ — Задание 1, п. 4. */}
            <Button
              type="submit"
              loading={pending}
              leftSection={<IconSend size={18} stroke={1.8} />}
            >
              Отправить
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
