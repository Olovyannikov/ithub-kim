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
import { IconAt, IconLock, IconPhone, IconUser, IconUserPlus } from '@tabler/icons-react';
import { useUnit } from 'effector-react';

import { validators } from '../../shared/forms';
import { routes } from '../../shared/routes';
import { AuthAside } from '../../shared/ui';
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
                  <Title order={2}>Регистрация</Title>
                  <Text size="sm" c="dimmed">
                    Создайте учётную запись, чтобы бронировать помещения.
                  </Text>
                </Stack>

                {serverErrors.message ? (
                  <Alert color="red" variant="light">
                    {serverErrors.message}
                  </Alert>
                ) : null}

                <TextInput
                  label="Логин"
                  description="Латиница и цифры, не менее 6 символов"
                  autoComplete="username"
                  leftSection={<IconUser size={18} stroke={1.8} />}
                  withAsterisk
                  {...fieldProps('login')}
                />

                <PasswordInput
                  label="Пароль"
                  description="Минимум 8 символов"
                  autoComplete="new-password"
                  leftSection={<IconLock size={18} stroke={1.8} />}
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
                  leftSection={<IconPhone size={18} stroke={1.8} />}
                  withAsterisk
                  {...fieldProps('phone')}
                />

                <TextInput
                  label="Электронная почта"
                  autoComplete="email"
                  leftSection={<IconAt size={18} stroke={1.8} />}
                  withAsterisk
                  {...fieldProps('email')}
                />

                {/* Текст кнопки задан ТЗ дословно — Задание 1, п. 1. */}
                <Button
                  type="submit"
                  loading={pending}
                  leftSection={<IconUserPlus size={18} stroke={1.8} />}
                >
                  Создать пользователя
                </Button>

                <Anchor component="button" type="button" ta="center" onClick={() => openLogin()}>
                  Уже зарегистрированы? Вход
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
