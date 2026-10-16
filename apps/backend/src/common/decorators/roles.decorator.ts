import type { UserRole } from '@kim/shared';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Ограничивает доступ к эндпоинту перечисленными ролями. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
