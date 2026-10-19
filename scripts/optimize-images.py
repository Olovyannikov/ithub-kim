#!/usr/bin/env python3
"""
Оптимизация изображений из приложения к заданию КИМ.

Задание 2: «Вам предоставлены изображения, которые необходимо оптимизировать
и улучшить». Критерий — «практический опыт создания, использования и
оптимизации изображения для веб-приложений».

Что делает скрипт:
  * кадрирует по центру в соотношение 3:2 — карточки помещений одинаковой
    высоты, без скачков вёрстки;
  * готовит два размера: 480 px для мобильного макета 390x844 и 960 px для
    экранов с удвоенной плотностью и для desktop;
  * сохраняет в двух современных форматах — AVIF и WebP, с запасным JPEG.

Исходники лежат в assets/source и в сборку не попадают: публикуется только
то, что получилось.

  python3 scripts/optimize-images.py
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'assets', 'source', 'rooms')
TARGET = os.path.join(ROOT, 'apps', 'frontend', 'public', 'rooms')

WIDTHS = (480, 960)
ASPECT = 3 / 2
WEBP_QUALITY = 80
JPEG_QUALITY = 82
AVIF_QUALITY = '58'  # шкала avifenc: меньше — лучше качество


def crop_to_aspect(image: Image.Image) -> Image.Image:
    """Центральное кадрирование под 3:2."""
    width, height = image.size
    target_height = width / ASPECT

    if target_height <= height:
        top = (height - target_height) / 2
        box = (0, top, width, top + target_height)
    else:
        target_width = height * ASPECT
        left = (width - target_width) / 2
        box = (left, 0, left + target_width, height)

    return image.crop(tuple(round(value) for value in box))


def encode_avif(png_path: str, avif_path: str) -> bool:
    if shutil.which('avifenc') is None:
        return False

    result = subprocess.run(
        ['avifenc', '--min', '0', '--max', '63', '-q', AVIF_QUALITY, '-s', '6', png_path, avif_path],
        capture_output=True,
    )

    return result.returncode == 0


def main() -> int:
    if not os.path.isdir(SOURCE):
        print(f'Нет каталога с исходниками: {SOURCE}', file=sys.stderr)
        return 1

    os.makedirs(TARGET, exist_ok=True)
    report: dict[str, dict] = {}
    source_total = 0
    output_total = 0

    for name in sorted(os.listdir(SOURCE)):
        if name.startswith('.'):
            continue

        slug = os.path.splitext(name)[0]
        path = os.path.join(SOURCE, name)
        source_total += os.path.getsize(path)

        with Image.open(path) as original:
            image = crop_to_aspect(original.convert('RGB'))

        sizes = {}

        for width in WIDTHS:
            height = round(width / ASPECT)
            resized = image.resize((width, height), Image.LANCZOS)

            webp_path = os.path.join(TARGET, f'{slug}-{width}.webp')
            resized.save(webp_path, 'WEBP', quality=WEBP_QUALITY, method=6)

            jpeg_path = os.path.join(TARGET, f'{slug}-{width}.jpg')
            resized.save(jpeg_path, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)

            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                tmp_png = tmp.name

            resized.save(tmp_png, 'PNG')
            avif_path = os.path.join(TARGET, f'{slug}-{width}.avif')
            has_avif = encode_avif(tmp_png, avif_path)
            os.unlink(tmp_png)

            entry = {'webp': os.path.getsize(webp_path), 'jpeg': os.path.getsize(jpeg_path)}

            if has_avif:
                entry['avif'] = os.path.getsize(avif_path)

            sizes[width] = entry
            output_total += min(entry.values())

        report[slug] = {'source': os.path.getsize(path), 'sizes': sizes}
        best = sizes[WIDTHS[0]]
        print(
            f'  {slug:12s} исходник {os.path.getsize(path) // 1024:4d} КБ → '
            f'480px: avif {best.get("avif", 0) // 1024} КБ, webp {best["webp"] // 1024} КБ, '
            f'jpeg {best["jpeg"] // 1024} КБ'
        )

    with open(os.path.join(TARGET, 'manifest.json'), 'w', encoding='utf-8') as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)

    print(
        f'\nисходники: {source_total // 1024} КБ, '
        f'лучший формат на каждый размер суммарно: {output_total // 1024} КБ'
    )

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
