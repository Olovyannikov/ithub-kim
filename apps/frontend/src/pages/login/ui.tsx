import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Grid,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLock, IconLogin2, IconUser } from '@tabler/icons-react';
import { useUnit } from 'effector-react';

import { validators } from '../../shared/forms';
import { routes } from '../../shared/routes';
import { AuthAside } from '../../shared/ui';
import { $pending, $serverErrors, formSubmitted, type LoginValues } from './model';

/** Задание 1, п. 2: страница авторизации. */
export function LoginPage() {
  const [serverErrors, pending, submit, openRegister] = useUnit([
    $serverErrors,
    $pending,
    formSubmitted,
    routes.register.open,
  ]);

  const form = useForm<LoginValues>({
    initialValues: { login: '', password: '' },
    // На входе формат логина и длину пароля не проверяем: иначе форма
    // подсказывала бы перебирающему, что он угадал формат (ADR-0004).
    validate: { login: validators.notEmpty, password: validators.notEmpty },
    validateInputOnBlur: true,
  });

  return (
    <Card
      withBorder
      p={0}
      maw={960}
      mx="auto"
      bg="white"
      radius="md"
      style={{ overflow: 'hidden' }}
    >
      <Grid gap={0}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Box p={{ base: 'lg', sm: 'xl' }}>
            <form
              onSubmit={form.onSubmit((values) => {
                submit(values);
              })}
              noValidate
            >
              <Stack gap="md">
                <Stack gap={4}>
                  <Title order={2}>Вход</Title>
                  <Text size="sm" c="dimmed">
                    Войдите, чтобы подать заявку и следить за её статусом.
                  </Text>
                </Stack>

                {serverErrors.message ? (
                  <Alert color="red" variant="light">
                    {serverErrors.message}
                  </Alert>
                ) : null}

                {/*
                  Ошибки клиента и сервера показываются в одном месте под полем —
                  требование Задания 2 «ошибки валидации должны отображаться на форме».
                */}
                <TextInput
                  label="Логин"
                  autoComplete="username"
                  leftSection={<IconUser size={18} stroke={1.8} />}
                  withAsterisk
                  {...form.getInputProps('login')}
                  error={form.errors.login ?? serverErrors.fields.login}
                />

                <PasswordInput
                  label="Пароль"
                  autoComplete="current-password"
                  leftSection={<IconLock size={18} stroke={1.8} />}
                  withAsterisk
                  {...form.getInputProps('password')}
                  error={form.errors.password ?? serverErrors.fields.password}
                />

                <Button
                  type="submit"
                  loading={pending}
                  leftSection={<IconLogin2 size={18} stroke={1.8} />}
                >
                  Войти
                </Button>

                {/* Текст ссылки задан ТЗ дословно — Задание 1, п. 2. */}
                <Anchor component="button" type="button" ta="center" onClick={() => openRegister()}>
                  Еще не зарегистрированы? Регистрация
                </Anchor>
              </Stack>
            </form>
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
          <AuthAside />
        </Grid.Col>
      </Grid>
    </Card>
  );
}
