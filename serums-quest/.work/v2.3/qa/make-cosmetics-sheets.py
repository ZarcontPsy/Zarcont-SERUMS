#!/usr/bin/env python3
"""Hojas de contacto de la Fase 2. Antes y después usan exactamente el mismo
formato; solo cambia la carpeta de origen. Salida en .work/v2.3/evidence/."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
EV = os.path.join(ROOT, '.work', 'v2.3', 'evidence')
BG = (7, 10, 17)
CARD = (14, 20, 31)
LINE = (42, 56, 80)
INK = (239, 243, 250)
MUTED = (150, 165, 190)
GOLD = (228, 192, 122)
TEAL = (105, 211, 193)
WHITE = (245, 247, 252)

PIECES = [
    ('c-torso-bata', 'Bata de evidencia', 'común · torso'),
    ('c-piernas-falda', 'Falda de mapas', 'poco común · piernas'),
    ('c-torso-manto', 'Manto de constelaciones', 'épico · torso'),
    ('c-peinado-mecha', 'Mecha violeta', 'raro · peinado'),
    ('c-cabeza-casco', 'Casco de vigía', 'épico · cabeza'),
    ('c-cabeza-diadema', 'Diadema de circuitos', 'raro · cabeza'),
    ('c-accesorios-bolso', 'Bolso de campo', 'común · extra'),
    ('c-accesorios-brujula', 'Brújula de muñeca', 'común · accesorio'),
    ('x-cuaderno-orbital', 'Cuaderno orbital', 'raro · extra'),
    ('x-luciernaga-observatorio', 'Luciérnaga del observatorio', 'raro · mascota'),
    ('x-trofeo-salud', 'Trofeo del Territorio', 'raro · extra'),
]
EFFECTS = [
    ('c-efecto-aura', 'Aura de alba'),
    ('x-aura-amanecer', 'Aura del amanecer'),
    ('c-efecto-bruma', 'Bruma de estudio'),
    ('c-efecto-constelacion', 'Constelación de logros'),
    ('c-efecto-chispas', 'Chispas de racha'),
    ('x-estela-racha', 'Estela de racha'),
    ('x-arma-destello', 'Destello del Territorio'),
    ('x-arma-marea', 'Marea del Cuidado'),
    ('x-arma-sello', 'Sello de la Confianza'),
    ('x-arma-prisma', 'Prisma de la Evidencia'),
    ('x-arma-orbita', 'Órbita del Sistema'),
]
HEROES = [('ilan', 'Ilan'), ('kian', 'Kian'), ('noa', 'Noa')]


def font(size, bold=False):
    for c in ([r"C:\Windows\Fonts\segoeuib.ttf"] if bold else [r"C:\Windows\Fonts\segoeui.ttf"]) + [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"]:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            pass
    return ImageFont.load_default()


def cell_image(path, w, h):
    im = Image.open(path).convert('RGB')
    return ImageOps.fit(im, (w, h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def header(d, width, title, subtitle):
    d.rectangle([0, 0, width, 6], fill=GOLD)
    d.text((26, 22), title, font=font(26, True), fill=WHITE)
    d.text((26, 58), subtitle, font=font(13), fill=MUTED)


def sheet(path_label, title, subtitle, items, out_name):
    cols, cw, ch = 6, 250, 198
    pad = 22
    rows = (len(items) + cols - 1) // cols
    width = cols * cw + (cols + 1) * pad
    height = 94 + rows * (ch + 46) + pad
    width = min(1600, width)
    height = min(1600, height)
    im = Image.new('RGB', (width, height), BG)
    d = ImageDraw.Draw(im)
    header(d, width, title, subtitle)
    for idx, (img, label, sub) in enumerate(items):
        r, c = idx // cols, idx % cols
        x = pad + c * (cw + pad)
        y = 94 + r * (ch + 46)
        d.rounded_rectangle([x, y, x + cw, y + ch + 34], radius=9, fill=CARD, outline=LINE, width=1)
        if os.path.exists(img):
            im.paste(cell_image(img, cw - 10, ch - 10), (x + 5, y + 5))
        d.text((x + 10, y + ch + 2), label, font=font(12, True), fill=INK)
        d.text((x + 10, y + ch + 19), sub, font=font(9), fill=MUTED)
        d.ellipse([x + cw - 16, y + 8, x + cw - 8, y + 16], fill=TEAL)
    im.save(os.path.join(EV, out_name), quality=84, subsampling=2, optimize=True)
    print(out_name, im.size, os.path.getsize(os.path.join(EV, out_name)))


def build_piece_items(folder):
    items = []
    for pid, label, sub in PIECES:
        for hid, hlabel in HEROES:
            items.append((os.path.join(EV, folder, 'pieza-%s-%s.png' % (hid, pid)),
                          label, '%s · %s' % (hlabel, sub)))
    return items


def build_effect_items(folder):
    items = []
    for eid, label in EFFECTS:
        for hid, hlabel in HEROES:
            items.append((os.path.join(EV, folder, 'efecto-%s-%s.png' % (hid, eid)),
                          label, '%s · efecto' % hlabel))
    return items


if __name__ == '__main__':
    sheet('before', 'SERUMS QUEST · V2.3 FASE 2 · ANTES · PIEZAS EN ILAN, KIAN Y NOA',
          'Mismo formato que la hoja «después»: 11 piezas × 3 héroes · visor 1308×662 · misma cámara y modelos de Fase 1B',
          build_piece_items('before'), 'sheet-antes-3-heroes.jpg')
    sheet('after', 'SERUMS QUEST · V2.3 FASE 2 · DESPUÉS · PIEZAS EN ILAN, KIAN Y NOA',
          'Mismo formato que la hoja «antes»: 11 piezas × 3 héroes · visor 1308×662 · misma cámara y modelos de Fase 2',
          build_piece_items('after'), 'sheet-despues-3-heroes.jpg')
    sheet('before', 'SERUMS QUEST · V2.3 FASE 2 · ANTES · EFECTOS EN 3 HÉROES',
          '11 efectos × Ilan, Kian y Noa · el héroe conserva el encuadre y la firma se compara con el después',
          build_effect_items('before'), 'sheet-antes-efectos-3-heroes.jpg')
    sheet('after', 'SERUMS QUEST · V2.3 FASE 2 · DESPUÉS · EFECTOS EN 3 HÉROES',
          '11 efectos × Ilan, Kian y Noa · héroe ≥60 % del alto en el visor · firmas propias',
          build_effect_items('after'), 'sheet-despues-efectos-3-heroes.jpg')
