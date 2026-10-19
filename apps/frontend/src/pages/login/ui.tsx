import { Alert, Anchor, Button, Card, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useUnit } from 'effector-react';

import { validators } from '../../shared/forms';
import { routes } from '../../shared/routes';
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
    <Card withBorder padding="xl" maw={440} mx="auto" bg="white">
      <form
        onSubmit={form.onSubmit((values) => {
          submit(values);
        })}
        noValidate
      >
        <Stack gap="md">
          <Title order={2}>Вход</Title>

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
            withAsterisk
            {...form.getInputProps('login')}
            error={form.errors.login ?? serverErrors.fields.login}
          />

          <PasswordInput
            label="Пароль"
            autoComplete="current-password"
            withAsterisk
            {...form.getInputProps('password')}
            error={form.errors.password ?? serverErrors.fields.password}
          />

          <Button type="submit" loading={pending}>
            Войти
          </Button>

          {/* Текст ссылки задан ТЗ дословно — Задание 1, п. 2. */}
          <Anchor component="button" type="button" ta="center" onClick={() => openRegister()}>
            Еще не зарегистрированы? Регистрация
          </Anchor>
        </Stack>
      </form>
    </Card>
  );
}
