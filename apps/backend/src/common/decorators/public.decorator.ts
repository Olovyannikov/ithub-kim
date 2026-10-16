import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Открывает эндпоинт без авторизации.
 *
 * Guard включён глобально, а исключения помечаются явно: забыть повесить защиту
 * проще, чем забыть открыть доступ, а цена ошибки несимметрична (ADR-0004).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
