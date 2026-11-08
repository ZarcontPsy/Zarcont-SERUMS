# -*- coding: utf-8 -*-
"""Contactos de capturas de parpadeo/estandartes para revisión visual (Agente 7)."""
import os, re, sys
from PIL import Image, ImageDraw, ImageFont

QA = os.path.dirname(os.path.abspath(__file__))
EV = os.path.normpath(os.path.join(QA, '..', 'evidence'))

def font(size):
    for name in ('arial.ttf', 'segoeui.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return ImageFont.load_default()

def sheet(files, out, cols, cell_w, title):
    if not files:
        print('sin archivos para', out)
        return None
    thumbs = []
    for f in files:
        try:
            im = Image.open(f).convert('RGB')
        except Exception as e:
            print('skip', f, e); continue
        ratio = cell_w / float(im.width)
        im = im.resize((cell_w, max(1, int(im.height * ratio))), Image.LANCZOS)
        thumbs.append((os.path.basename(f), im))
    if not thumbs:
        return None
    cell_h = max(t[1].height for t in thumbs)
    rows = (len(thumbs) + cols - 1) // cols
    pad = 10
    header = 42
    W = cols * (cell_w + pad) + pad
    H = rows * (cell_h + 26 + pad) + pad + header
    canvas = Image.new('RGB', (W, H), (10, 14, 22))
    d = ImageDraw.Draw(canvas)
    d.text((pad, 10), title, fill=(230, 230, 235), font=font(20))
    for i, (name, im) in enumerate(thumbs):
        c = i % cols; r = i // cols
        x = pad + c * (cell_w + pad); y = header + pad + r * (cell_h + 26 + pad)
        canvas.paste(im, (x, y))
        label = re.sub(r'^agent7-v21-(base|final)-', '', name[:-4])
        d.text((x, y + im.height + 4), label, fill=(160, 175, 195), font=font(13))
    canvas.save(out, 'PNG')
    print('contacto', out, canvas.size, 'celdas', len(thumbs))
    return out

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'base'
    prefix = 'agent7-v21-%s-' % mode
    all_blink = sorted([os.path.join(EV, f) for f in os.listdir(EV)
                        if f.startswith(prefix + 'parpadeo-') and f.endswith('.png')
                        and 'contacto' not in f])
    normal = [f for f in all_blink if 'cosmetico' not in os.path.basename(f) and 'ranura' not in os.path.basename(f)]
    cosmetic = [f for f in all_blink if 'cosmetico' in os.path.basename(f) or 'ranura' in os.path.basename(f)]
    banners = sorted([os.path.join(EV, f) for f in os.listdir(EV)
                      if f.startswith(prefix + 'estandarte-') and f.endswith('.png')
                      and 'contacto' not in f and 'close' not in f])
    closeups = sorted([os.path.join(EV, f) for f in os.listdir(EV)
                       if f.startswith(prefix + 'estandarte-') and 'close' in f and f.endswith('.png')])
    sheet(normal, os.path.join(EV, 'agent7-v21-%s-contacto-parpadeo.png' % mode), 5, 300,
          'SERUMS QUEST V2.1 · parpadeo/z-fighting · 10 héroes × 3 ángulos (%s)' % mode)
    sheet(cosmetic, os.path.join(EV, 'agent7-v21-%s-contacto-parpadeo-cosmeticos.png' % mode), 5, 300,
          'SERUMS QUEST V2.1 · parpadeo/z-fighting · 10 héroes con cosmético + ranuras (%s)' % mode)
    sheet(banners, os.path.join(EV, 'agent7-v21-%s-contacto-estandartes.png' % mode), 3, 420,
          'SERUMS QUEST V2.1 · banderines/estandartes por arena (%s)' % mode)
    sheet(closeups, os.path.join(EV, 'agent7-v21-%s-contacto-estandartes-close.png' % mode), 4, 340,
          'SERUMS QUEST V2.1 · close-up de estandartes (%s)' % mode)

if __name__ == '__main__':
    main()
