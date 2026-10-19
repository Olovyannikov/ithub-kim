import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Rating,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCalendarPlus, IconMessage2Plus, IconSend } from '@tabler/icons-react';
import { useUnit } from 'effector-react';

import { ApplicationCard } from '../../entities/application';
import { validators } from '../../shared/forms';
import { plural } from '../../shared/lib';
import { routes } from '../../shared/routes';
import {
  $applications,
  $isEmpty,
  $loadError,
  $pending,
  $reviewErrors,
  $reviewingId,
  $reviewPending,
  reviewFormClosed,
  reviewFormOpened,
  reviewSubmitted,
  type ReviewValues,
} from './model';

/** Задание 1, п. 3: страница просмотра заявок. */
export function ApplicationsPage() {
  const [
    applications,
    pending,
    isEmpty,
    loadError,
    reviewingId,
    reviewErrors,
    reviewPending,
    openReview,
    closeReview,
    submitReview,
    openCreate,
  ] = useUnit([
    $applications,
    $pending,
    $isEmpty,
    $loadError,
    $reviewingId,
    $reviewErrors,
    $reviewPending,
    reviewFormOpened,
    reviewFormClosed,
    reviewSubmitted,
    routes.applicationCreate.open,
  ]);

  const form = useForm<ReviewValues>({
    initialValues: { rating: 5, text: '' },
    validate: { rating: validators.rating, text: validators.reviewText },
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={1}>Мои заявки</Title>
          {applications.length > 0 ? (
            <Text c="dimmed">
              {applications.length} {plural(applications.length, ['заявка', 'заявки', 'заявок'])}
            </Text>
          ) : null}
        </Stack>
        <Button
          leftSection={<IconCalendarPlus size={18} stroke={1.8} />}
          onClick={() => openCreate()}
        >
          Новая заявка
        </Button>
      </Group>

      {loadError ? (
        <Alert color="red" variant="light">
          {loadError}
        </Alert>
      ) : null}

      {pending && applications.length === 0 ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : null}

      {isEmpty && !loadError ? (
        <Card withBorder padding="xl" bg="white">
          <Stack gap="sm" align="flex-start">
            <Title order={3}>Заявок пока нет</Title>
            <Text c="dimmed">
              Выберите помещение для конференции и укажите удобное время — заявка поступит
              администратору портала.
            </Text>
            <Button
              leftSection={<IconCalendarPlus size={18} stroke={1.8} />}
              onClick={() => openCreate()}
            >
              Сформировать заявку
            </Button>
          </Stack>
        </Card>
      ) : null}

      <Stack gap="md">
        {applications.map((application, index) => (
          <ApplicationCard
            key={application.id}
            application={application}
            eagerImage={index === 0}
            actions={
              // Право на отзыв считает сервер: Задание 2, п. 3 — только после
              // завершения мероприятия.
              application.canLeaveReview ? (
                <Button
                  variant="light"
                  leftSection={<IconMessage2Plus size={18} stroke={1.8} />}
                  onClick={() => openReview(application.id)}
                >
                  Оставить отзыв
                </Button>
              ) : null
            }
          />
        ))}
      </Stack>

      <Modal
        opened={reviewingId !== null}
        onClose={() => closeReview()}
        title="Отзыв о мероприятии"
        centered
      >
        <form
          onSubmit={form.onSubmit((values) => {
            submitReview(values);
          })}
          noValidate
        >
          <Stack gap="md">
            {reviewErrors.message ? (
              <Alert color="red" variant="light">
                {reviewErrors.message}
              </Alert>
            ) : null}

            <Stack gap={4}>
              <Text size="sm" fw={500}>
                Оценка качества
              </Text>
              <Rating
                value={form.values.rating}
                onChange={(value) => form.setFieldValue('rating', value)}
              />
              {(form.errors.rating ?? reviewErrors.fields.rating) ? (
                <Text size="xs" c="red">
                  {form.errors.rating ?? reviewErrors.fields.rating}
                </Text>
              ) : null}
            </Stack>

            <Textarea
              label="Текст отзыва"
              autosize
              minRows={3}
              maxRows={8}
              withAsterisk
              {...form.getInputProps('text')}
              error={form.errors.text ?? reviewErrors.fields.text}
            />

            <Group justify="flex-end">
              <Button variant="default" onClick={() => closeReview()}>
                Отмена
              </Button>
              <Button
                type="submit"
                loading={reviewPending}
                leftSection={<IconSend size={18} stroke={1.8} />}
              >
                Отправить отзыв
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
