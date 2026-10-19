#!/usr/bin/env node
/**
 * Оптимизация изображений из приложения к заданию КИМ.
 *
 * Задание 2: «Вам предоставлены изображения, которые необходимо оптимизировать
 * и улучшить». Критерий — «практический опыт создания, использования и
 * оптимизации изображения для веб-приложений».
 *
 * Что делает конвейер:
 *   * кадрирует по центру в соотношение 3:2 — карточки помещений одинаковой
 *     высоты, без скачков вёрстки;
 *   * готовит два размера: 480 px для мобильного макета 390x844 и 960 px для
 *     экранов с удвоенной плотностью и для desktop;
 *   * сохраняет в двух современных форматах — AVIF и WebP, с запасным JPEG.
 *
 * Раньше это был скрипт на Python: Pillow для обработки плюс `avifenc` из
 * Homebrew. На площадке ДЭ ни того, ни другого может не оказаться, а Node
 * нужен в любом случае — поэтому конвейер переписан на `sharp`, который
 * умеет и изменение размера, и все три формата. У `sharp` нет postinstall,
 * скачивающего что-то из сети: бинарники приезжают обычными npm-пакетами и
 * спокойно ложатся в офлайн-хранилище.
 *
 *   pnpm images
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'assets', 'source', 'rooms');
const TARGET = join(ROOT, 'apps', 'frontend', 'public', 'rooms');

const SOCIAL_SOURCE = join(ROOT, 'assets', 'source', 'social', 'social.png');
const SOCIAL_TARGET = join(ROOT, 'apps', 'frontend', 'public', 'social');

/** Сторона значка соцсети: 28 px в подвале на экране с удвоенной плотностью. */
const SOCIAL_SIZE = 96;

const WIDTHS = [480, 960];
const ASPECT = 3 / 2;

/** Качество подобрано так, чтобы разница на фотографии интерьера не читалась. */
const QUALITY = { avif: 58, webp: 80, jpeg: 82 };

const FORMATS = [
  { ext: 'avif', encode: (pipeline) => pipeline.avif({ quality: QUALITY.avif, effort: 6 }) },
  { ext: 'webp', encode: (pipeline) => pipeline.webp({ quality: QUALITY.webp, effort: 6 }) },
  {
    ext: 'jpg',
    encode: (pipeline) =>
      pipeline.jpeg({ quality: QUALITY.jpeg, progressive: true, mozjpeg: true }),
  },
];

function kb(bytes) {
  return Math.round(bytes / 1024);
}

async function main() {
  const files = (await readdir(SOURCE)).filter((name) => !name.startsWith('.'));

  if (files.length === 0) {
    throw new Error(`Нет исходных изображений в ${SOURCE}`);
  }

  await mkdir(TARGET, { recursive: true });

  const report = {};
  let sourceTotal = 0;
  let outputTotal = 0;

  for (const name of files.sort()) {
    const slug = name.slice(0, -extname(name).length);
    const path = join(SOURCE, name);
    const sourceSize = (await stat(path)).size;
    sourceTotal += sourceSize;

    const sizes = {};

    for (const width of WIDTHS) {
      const height = Math.round(width / ASPECT);
      const entry = {};

      for (const { ext, encode } of FORMATS) {
        // Конвейер пересоздаётся на каждый формат: sharp нельзя переиспользовать
        // после вызова кодировщика.
        const pipeline = sharp(path).resize(width, height, {
          fit: 'cover',
          position: 'centre',
        });

        const buffer = await encode(pipeline).toBuffer();
        await writeFile(join(TARGET, `${slug}-${width}.${ext}`), buffer);
        entry[ext] = buffer.length;
      }

      sizes[width] = entry;
      outputTotal += Math.min(...Object.values(entry));
    }

    report[slug] = { source: sourceSize, sizes };

    const best = sizes[WIDTHS[0]];
    console.log(
      `  ${slug.padEnd(12)} исходник ${String(kb(sourceSize)).padStart(4)} КБ → ` +
        `480px: avif ${kb(best.avif)} КБ, webp ${kb(best.webp)} КБ, jpeg ${kb(best.jpg)} КБ`,
    );
  }

  await writeFile(join(TARGET, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(
    `\nисходники: ${kb(sourceTotal)} КБ, ` +
      `лучший формат на каждый размер суммарно: ${kb(outputTotal)} КБ`,
  );
}

/**
 * Находит границы содержимого: прямоугольник, за которым только фон.
 *
 * Фоном считается и прозрачное, и почти белое — исходник значков соцсетей
 * нарисован на непрозрачной белой подложке, и без этого вокруг значка в
 * подвале оставалось белое поле на сером фоне страницы.
 */
function contentBounds(data, { width, height, channels }, from = 0, to = width) {
  let minX = to;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = from; x < to; x += 1) {
      const i = (y * width + x) * channels;
      const alpha = channels === 4 ? data[i + 3] : 255;

      if (alpha < 10) {
        continue;
      }

      const isWhite = data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245;

      if (isWhite) {
        continue;
      }

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Делает фон прозрачным — заливкой от краёв.
 *
 * У значков скруглённые углы, и за дугой остаётся белый фон исходника: на
 * сером подвале он читался светлыми уголками. Простая замена «всё белое — в
 * прозрачное» не годится: внутри самих значков белым нарисованы буквы.
 * Поэтому прозрачными становятся только те белые пиксели, до которых можно
 * дойти от границы изображения, не пересекая рисунок.
 *
 * Полупрозрачность по дуге считается по «белизне» пикселя — иначе вместо
 * мягкого края получилась бы ступенька.
 */
function clearBackground(data, { width, height, channels }) {
  const isBackground = (i) => data[i] > 215 && data[i + 1] > 215 && data[i + 2] > 215;

  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x += 1) {
    queue.push([x, 0], [x, height - 1]);
  }

  for (let y = 0; y < height; y += 1) {
    queue.push([0, y], [width - 1, y]);
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();

    if (x < 0 || y < 0 || x >= width || y >= height) {
      continue;
    }

    const index = y * width + x;

    if (visited[index]) {
      continue;
    }

    const i = index * channels;

    if (!isBackground(i)) {
      continue;
    }

    visited[index] = 1;

    // Чем белее пиксель, тем он прозрачнее: на границе дуги цвет уже
    // подмешан, и обнулять его целиком — значит получить рваный край.
    const whiteness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const alpha = Math.max(0, Math.round(((255 - whiteness) / 40) * 255));

    data[i + 3] = Math.min(data[i + 3], alpha);

    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return data;
}

/**
 * Режет значки соцсетей из одной картинки приложения к заданию.
 *
 * В исходнике два значка стоят рядом на белом фоне. Раньше их вырезали
 * вручную с запасом, и запас этот был виден: светлая рамка вокруг каждого
 * значка на сером фоне подвала. Теперь границы считаются по содержимому.
 */
async function social() {
  const { data, info } = await sharp(SOCIAL_SOURCE).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  // Значки стоят рядом, поэтому ищем каждый в своей половине исходника.
  const half = Math.floor(info.width / 2);
  const icons = [
    { name: 'vk', bounds: contentBounds(data, info, 0, half) },
    { name: 'ok', bounds: contentBounds(data, info, half, info.width) },
  ];

  await mkdir(SOCIAL_TARGET, { recursive: true });

  for (const { name, bounds } of icons) {
    // Фон убирается до изменения размера: на уменьшенной картинке углы уже
    // размыты, и отличить фон от рисунка нельзя.
    const cut = await sharp(SOCIAL_SOURCE)
      .extract(bounds)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buffer = await sharp(clearBackground(cut.data, cut.info), {
      raw: { width: cut.info.width, height: cut.info.height, channels: cut.info.channels },
    })
      .resize(SOCIAL_SIZE, SOCIAL_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 90, effort: 6 })
      .toBuffer();

    await writeFile(join(SOCIAL_TARGET, `${name}.webp`), buffer);

    console.log(
      `  ${name.padEnd(12)} вырезано ${bounds.width}x${bounds.height} из исходника → ` +
        `${SOCIAL_SIZE}px webp, ${kb(buffer.length)} КБ`,
    );
  }
}

await main();
await social();
