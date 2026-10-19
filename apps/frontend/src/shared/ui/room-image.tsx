import { Box } from '@mantine/core';

const WIDTHS = [480, 960] as const;

interface RoomImageProps {
  /** Базовое имя файла, приходит из поля `imageUrl` помещения. */
  slug: string | null;
  alt: string;
  /** Во сколько CSS-пикселей отрисуется картинка — для выбора размера браузером. */
  sizes?: string;
  radius?: string;
  /** Первый экран грузим сразу, остальное — отложенно. */
  eager?: boolean;
}

function srcSet(slug: string, extension: string): string {
  return WIDTHS.map((width) => `/rooms/${slug}-${width}.${extension} ${width}w`).join(', ');
}

/**
 * Фотография помещения (ADR-0008).
 *
 * Отдаём AVIF и WebP с запасным JPEG — браузер берёт первый формат, который
 * понимает. Два размера и `sizes` не дают телефону грузить картинку для
 * desktop, а заданное соотношение сторон не даёт странице прыгать при
 * подгрузке.
 */
export function RoomImage({
  slug,
  alt,
  sizes = '(max-width: 48em) 100vw, 480px',
  radius = 'var(--mantine-radius-md)',
  eager = false,
}: RoomImageProps) {
  if (!slug) {
    return null;
  }

  return (
    <Box
      style={{
        aspectRatio: '3 / 2',
        overflow: 'hidden',
        borderRadius: radius,
        background: 'var(--mantine-color-gray-1)',
      }}
    >
      <picture>
        <source type="image/avif" srcSet={srcSet(slug, 'avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(slug, 'webp')} sizes={sizes} />
        <img
          src={`/rooms/${slug}-960.jpg`}
          srcSet={srcSet(slug, 'jpg')}
          sizes={sizes}
          alt={alt}
          width={960}
          height={640}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </picture>
    </Box>
  );
}
