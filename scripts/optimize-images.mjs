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

await main();
