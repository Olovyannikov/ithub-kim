import { APPLICATION_STATUSES } from '@kim/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../../test/render';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it.each(APPLICATION_STATUSES)('подпись «%s» выводится без изменения регистра', (status) => {
    renderWithProviders(<StatusBadge status={status} />);

    // Badge в Mantine по умолчанию переводит текст в верхний регистр, а
    // подписи статусов заданы ТЗ и должны совпадать буквально (ADR-0007).
    expect(screen.getByText(status)).toBeInTheDocument();
    expect(screen.getByText(status)).toHaveStyle({ textTransform: 'none' });
  });
});
