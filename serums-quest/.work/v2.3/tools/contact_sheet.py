#!/usr/bin/env python
"""Hoja de contacto compacta para evidencia de SERUMS QUEST V2.3.

Uso:
  python .work/v2.3/tools/contact_sheet.py --out ruta.jpg --cols 4 --width 320 img1.png img2.png ...
  python .work/v2.3/tools/contact_sheet.py --out ruta.jpg --dir carpeta --pattern "*.png" --cols 4
Las imágenes se reducen a --width px de ancho; la hoja final no supera 1600 px.
"""
from __future__ import annotations
import argparse
import glob
import os
import sys
from PIL import Image, ImageDraw, ImageFont

def label_for(path: str) -> str:
    return os.path.basename(path)

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--dir')
    ap.add_argument('--pattern', default='*.png')
    ap.add_argument('--cols', type=int, default=4)
    ap.add_argument('--width', type=int, default=320)
    ap.add_argument('--max-width', type=int, default=1600)
    ap.add_argument('--bg', default='#0b1020')
    ap.add_argument('files', nargs='*')
    args = ap.parse_args()
    files = list(args.files)
    if args.dir:
        files += sorted(glob.glob(os.path.join(args.dir, args.pattern)))
    files = [f for f in files if os.path.isfile(f)]
    if not files:
        print('No hay imágenes', file=sys.stderr)
        return 2
    cols = max(1, args.cols)
    width = max(120, args.width)
    if width * cols > args.max_width:
        width = max(120, args.max_width // cols)
    rows = (len(files) + cols - 1) // cols
    pad = 8
    cap_h = 24
    cell_h = width + cap_h
    sheet = Image.new('RGB', (cols * (width + pad) + pad, rows * (cell_h + pad) + pad), args.bg)
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('segoeui.ttf', 12)
    except Exception:
        font = ImageFont.load_default()
    for i, path in enumerate(files):
        try:
            im = Image.open(path).convert('RGB')
        except Exception:
            continue
        im.thumbnail((width, width), Image.LANCZOS)
        cw = im.width
        ch = im.height
        x = pad + (i % cols) * (width + pad) + (width - cw) // 2
        y = pad + (i // cols) * (cell_h + pad)
        sheet.paste(im, (x, y))
        caption = label_for(path)[:48]
        draw.text((pad + (i % cols) * (width + pad), y + width + 4), caption, fill='#aeb8cc', font=font)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    sheet.save(args.out, quality=88, optimize=True)
    print('sheet:', args.out, sheet.size, 'files:', len(files))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
