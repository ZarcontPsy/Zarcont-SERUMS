#!/usr/bin/env python3
"""Hojas de contacto de la Fase 1B. Solo lee .work/v2.3b/evidence y escribe
en .work/v2.3b/evidence/checkpoint/. Usa Pillow del Python del sistema."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
EV = os.path.join(ROOT, '.work', 'v2.3b', 'evidence')
AFTER = os.path.join(EV, 'after')
BEFORE = os.path.join(EV, 'before')
OUT = os.path.join(EV, 'checkpoint')
os.makedirs(OUT, exist_ok=True)

BG = (8, 11, 18)
CARD = (15, 21, 33)
LINE = (44, 58, 82)
INK = (238, 242, 250)
MUTED = (156, 170, 194)
GOLD = (228, 192, 122)
TEAL = (105, 211, 193)
WHITE = (245, 247, 252)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\seguisb.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()


def fit_image(path, w, h, mode='fit'):
    im = Image.open(path).convert('RGB')
    if mode == 'contain':
        im.thumbnail((w, h), Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', (w, h), (5, 8, 14))
        canvas.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
        return canvas
    return ImageOps.fit(im, (w, h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def sheet(title, subtitle, items, cols, cell_w, cell_h, out_name, fit_mode='fit'):
    pad = 26
    head = 92
    rows = (len(items) + cols - 1) // cols
    width = cols * cell_w + (cols + 1) * pad
    height = head + rows * (cell_h + 34) + (rows + 1) * pad
    width = min(width, 1600)
    height = min(height, 1600)
    im = Image.new('RGB', (width, height), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, width, 6], fill=GOLD)
    d.text((pad, 24), title, font=font(28, True), fill=WHITE)
    d.text((pad, 60), subtitle, font=font(14), fill=MUTED)
    for idx, item in enumerate(items):
        r = idx // cols
        c = idx % cols
        x = pad + c * (cell_w + pad)
        y = head + pad + r * (cell_h + 34)
        d.rounded_rectangle([x, y, x + cell_w, y + cell_h + 28], radius=10, fill=CARD, outline=LINE, width=1)
        img_path, label, detail = item
        if os.path.exists(img_path):
            thumb = fit_image(img_path, cell_w - 12, cell_h - 12, fit_mode)
            im.paste(thumb, (x + 6, y + 6))
        d.text((x + 12, y + cell_h - 1), label, font=font(14, True), fill=INK)
        d.text((x + 12, y + cell_h + 15), detail, font=font(10), fill=MUTED)
        d.ellipse([x + cell_w - 18, y + 10, x + cell_w - 10, y + 18], fill=TEAL)
    im.save(os.path.join(OUT, out_name), quality=84, subsampling=2, optimize=True)
    print(out_name, im.size, os.path.getsize(os.path.join(OUT, out_name)))


def welcome_items(levels=None):
    specs = [
        ('640x360', '640 × 360 · apaisado bajo'), ('844x390', '844 × 390 · apaisado bajo'),
        ('1024x600', '1024 × 600'), ('1308x662', '1308 × 662 · referencia de escritorio'),
        ('1280x720', '1280 × 720'), ('1920x1080', '1920 × 1080'),
        ('2560x1080', '2560 × 1080 · ultra ancho'), ('768x1024', '768 × 1024 · vertical'),
        ('820x1180', '820 × 1180 · vertical'), ('390x844', '390 × 844 · móvil vertical'),
    ]
    items = []
    for name, label in specs:
        if levels and name not in levels:
            continue
        items.append((os.path.join(AFTER, 'welcome-%s.png' % name), label, 'héroes en zona propia · sin recorte · CTAs y 5 rutas dentro'))
    return items


def tutorial_items(size, cell_desc):
    items = []
    names = ['MOVIMIENTO', 'DUELO', 'REPASO', 'MAPA', 'TIENDA']
    for i, step in enumerate(range(1, 6)):
        items.append((os.path.join(AFTER, 'tutorial-%s-step%d.png' % (size, step)), 'Paso %d · %s' % (step, names[i]), cell_desc))
    return items


def before_after_items():
    return [
        (os.path.join(BEFORE, 'welcome-1280x720.png'), 'ANTES · bienvenida 1280 × 720', 'V2.3 Fase 1 · retratos 2D sobre el mundo'),
        (os.path.join(AFTER, 'welcome-1280x720.png'), 'DESPUÉS · bienvenida 1280 × 720', 'Fase 1B · escena compartida y encuadre por caja'),
        (os.path.join(BEFORE, 'tutorial-1280x720.png'), 'ANTES · tutorial 1280 × 720', 'tarjeta pequeña con listas'),
        (os.path.join(AFTER, 'tutorial-1280x720-step1.png'), 'DESPUÉS · tutorial 1280 × 720', 'pantalla completa + mini-escena 3D'),
    ]


if __name__ == '__main__':
    sheet('SERUMS QUEST · V2.3 FASE 1B · BIENVENIDA EN 10 TAMAÑOS',
          'Escena 3D compartida · encuadre por caja real · márgenes laterales ≥ 10 % y verticales ≥ 12 % · versión V2.3 · Fase 1B',
          welcome_items(), 3, 500, 300, 'sheet-bienvenida-10-tamanos.jpg', 'contain')
    sheet('BIENVENIDA · DETALLE VERTICAL',
          'Formato completo: héroes arriba, texto abajo y botones a ancho completo · 768 × 1024, 820 × 1180 y 390 × 844',
          welcome_items({'768x1024', '820x1180', '390x844'}), 3, 500, 1040, 'sheet-bienvenida-vertical.jpg', 'contain')
    sheet('TUTORIAL · 5 PASOS · 1280 × 720',
          'Cada paso con mini-escena 3D, constelación de progreso y texto en su propia zona · 75 FPS',
          tutorial_items('1280x720', 'escritorio · 5 pasos · mismo overlay y mismo canvas'),
          2, 740, 416, 'sheet-tutorial-1280x720.jpg')
    sheet('TUTORIAL · 5 PASOS · 640 × 360',
          'Apaisado bajo: texto compacto, escena a la izquierda y CTAs completos dentro de la ventana',
          tutorial_items('640x360', '640 × 360 · 75 FPS'),
          2, 720, 405, 'sheet-tutorial-640x360.jpg')
    sheet('TUTORIAL · 5 PASOS · 390 × 844',
          'Vertical: escena arriba, texto abajo y botón principal a ancho completo',
          tutorial_items('390x844', '390 × 844 · 75 FPS'),
          5, 292, 632, 'sheet-tutorial-390x844.jpg')
    sheet('ANTES / DESPUÉS · BIENVENIDA Y TUTORIAL',
          'El «antes» se regeneró con el build de Fase 1 para comparar composición; el «después» es el build de Fase 1B',
          before_after_items(), 2, 740, 416, 'sheet-antes-despues.jpg')
