import { Alert, Anchor, Button, Card, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useUnit } from 'effector-react';

import { validators } from '../../shared/forms';
import { routes } from '../../shared/routes';
import { $pending, $serverErrors, formSubmitted, type RegisterValues } from './model';

/**
 * Задание 1, п. 1: страница регистрации.
 *
 * Правила полей и тексты ошибок не задаются здесь — они приходят из
 * `@kim/shared` через `validators` (ADR-0005).
 */
export function RegisterPage() {
  const [serverErrors, pending, submit, openLogin] = useUnit([
    $serverErrors,
    $pending,
    formSubmitted,
    routes.login.open,
  ]);

  const form = useForm<RegisterValues>({
    initialValues: { login: '', password: '', fullName: '', phone: '', email: '' },
    validate: {
      login: validators.login,
      password: validators.password,
      fullName: validators.fullName,
      phone: validators.phone,
      email: validators.email,
    },
    validateInputOnBlur: true,
  });

  const fieldProps = (name: keyof RegisterValues) => ({
    ...form.getInputProps(name),
    error: form.errors[name] ?? serverErrors.fields[name],
  });

  return (
    <Card withBorder padding="xl" maw={520} mx="auto" bg="white">
      <form
        onSubmit={form.onSubmit((values) => {
          submit(values);
        })}
        noValidate
      >
        <Stack gap="md">
          <Title order={2}>Регистрация</Title>

          {serverErrors.message ? (
            <Alert color="red" variant="light">
              {serverErrors.message}
            </Alert>
          ) : null}

          <TextInput
            label="Логин"
            description="Латиница и цифры, не менее 6 символов"
            autoComplete="username"
            withAsterisk
            {...fieldProps('login')}
          />

          <PasswordInput
            label="Пароль"
            description="Минимум 8 символов"
            autoComplete="new-password"
            withAsterisk
            {...fieldProps('password')}
          />

          <TextInput
            label="ФИО"
            description="Символы кириллицы и пробелы"
            autoComplete="name"
            withAsterisk
            {...fieldProps('fullName')}
          />

          <TextInput
            label="Телефон"
            placeholder="8(XXX)XXX-XX-XX"
            autoComplete="tel"
            withAsterisk
            {...fieldProps('phone')}
          />

          <TextInput
            label="Электронная почта"
            autoComplete="email"
            withAsterisk
            {...fieldProps('email')}
          />

          {/* Текст кнопки задан ТЗ дословно — Задание 1, п. 1. */}
          <Button type="submit" loading={pending}>
            Создать пользователя
          </Button>

          <Anchor component="button" type="button" ta="center" onClick={() => openLogin()}>
            Уже зарегистрированы? Вход
          </Anchor>
        </Stack>
      </form>
    </Card>
  );
}
