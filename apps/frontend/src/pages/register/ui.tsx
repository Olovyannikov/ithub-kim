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
import { useMask } from '@mantine/hooks';
import { IconAt, IconLock, IconPhone, IconUser, IconUserPlus } from '@tabler/icons-react';
import { useUnit } from 'effector-react';

import { validators } from '../../shared/forms';
import { AuthAside } from '../../shared/ui';
import { RegisterPageModel, type RegisterValues } from './model';

/**
 * Задание 1, п. 1: страница регистрации.
 *
 * Правила полей и тексты ошибок не задаются здесь — они приходят из
 * `@kim/shared` через `validators` (ADR-0005).
 */
export function RegisterPage() {
  const { serverErrors, pending, submit, openLogin } = useUnit(RegisterPageModel.viewModel);

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

  /**
   * Маска телефона — `useMask` из `@mantine/hooks`.
   *
   * ТЗ требует строго `8(XXX)XXX-XX-XX`, и раньше пользователь узнавал об
   * этом только после ошибки: вводил `+79126984159` и получал красное поле.
   * Маска показывает формат сразу и не даёт ввести лишнего, так что ошибка
   * остаётся только для действительно незаполненного номера.
   *
   * Поле при этом неуправляемое: маска пишет значение в DOM сама, а в форму
   * оно попадает через `onChangeRaw` — иначе два источника значения спорили
   * бы за каждый символ.
   */
  // Деструктурируем сразу: `phoneMask.ref` в разметке линтер принимает за
  // чтение ref во время рендера, хотя это callback-ref, а не объект.
  const { ref: phoneRef } = useMask({
    mask: '8(999)999-99-99',
    onChangeRaw: (_raw, masked) => form.setFieldValue('phone', masked),
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
                  ref={phoneRef}
                  label="Телефон"
                  placeholder="8(XXX)XXX-XX-XX"
                  autoComplete="tel"
                  inputMode="tel"
                  leftSection={<IconPhone size={18} stroke={1.8} />}
                  withAsterisk
                  onBlur={() => form.validateField('phone')}
                  error={form.errors.phone ?? serverErrors.fields.phone}
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
