#!/usr/bin/env python3
"""Hojas de la puerta de calidad de Fase 2: una pieza por rareza, siluetas,
diferencia estructural entre efectos y miniaturas antes/después."""
import os, json, math
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
EV = os.path.join(ROOT, '.work', 'v2.3', 'evidence')
SIL = os.path.join(EV, 'silhouettes')
QA = os.path.join(EV, 'qa')
BG = (7, 10, 17); CARD = (14, 20, 31); LINE = (42, 56, 80)
INK = (239, 243, 250); MUTED = (150, 165, 190); GOLD = (228, 192, 122); TEAL = (105, 211, 193)
WHITE = (245, 247, 252); RED = (255, 110, 120); GREEN = (105, 211, 193)


def font(size, bold=False):
    for c in ([r"C:\Windows\Fonts\segoeuib.ttf"] if bold else [r"C:\Windows\Fonts\segoeui.ttf"]) + [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"]:
        try: return ImageFont.truetype(c, size)
        except Exception: pass
    return ImageFont.load_default()


def header(d, width, title, subtitle):
    d.rectangle([0, 0, width, 6], fill=GOLD)
    d.text((26, 22), title, font=font(26, True), fill=WHITE)
    d.text((26, 58), subtitle, font=font(13), fill=MUTED)


def fit(path, w, h):
    im = Image.open(path).convert('RGB')
    return ImageOps.fit(im, (w, h), Image.Resampling.LANCZOS)


def read_json(path, fallback):
    try: return json.load(open(path, encoding='utf-8'))
    except Exception: return fallback


def one_rarity():
    gate = read_json(os.path.join(QA, 'gate.json'), {})
    by_id = {p['id']: p for p in gate.get('all', [])}
    picks = [
        ('comun', 'c-cabeza-gorro', 'Común'),
        ('poco_comun', 'c-torso-bata', 'Poco común'),
        ('raro', 'c-peinado-mecha', 'Raro'),
        ('epico', 'c-torso-manto', 'Épico'),
        ('legendario', 'c-cabeza-corona', 'Legendario'),
    ]
    cols, cw, ch, pad = 5, 300, 240, 24
    width = cols * cw + (cols + 1) * pad
    height = 94 + ch + 80 + pad
    im = Image.new('RGB', (min(width, 1600), height), BG)
    d = ImageDraw.Draw(im)
    header(d, im.width, 'UNA PIEZA DE CADA RAREZA · DESPUÉS', 'Misma cámara del visor · Noa · métricas de la puerta de silueta')
    for i, (rar, pid, label) in enumerate(picks):
        x = pad + i * (cw + pad); y = 94 + pad
        d.rounded_rectangle([x, y, x + cw, y + ch + 60], 10, fill=CARD, outline=LINE, width=1)
        src = os.path.join(EV, 'after', 'pieza-noa-' + pid + '.png')
        if os.path.exists(src):
            im.paste(fit(src, cw - 12, ch - 12), (x + 6, y + 6))
        p = by_id.get(pid, {})
        d.text((x + 12, y + ch + 2), label, font=font(14, True), fill=GOLD)
        d.text((x + 12, y + ch + 21), p.get('rarity', '') + ' · ' + pid, font=font(9), fill=MUTED)
        if p.get('verdict'):
            d.text((x + 12, y + ch + 36), 'boxiness %.3f · %d formas · %d tonos' % (p.get('boxiness', 0), len(p.get('forms', [])), len(p.get('tones', []))), font=font(9), fill=TEAL)
    im.save(os.path.join(EV, 'sheet-una-pieza-por-rareza.jpg'), quality=86)
    print('sheet-una-pieza-por-rareza.jpg', im.size)


def silhouettes():
    gate = read_json(os.path.join(QA, 'gate.json'), {})
    by_id = {p['id']: p for p in gate.get('all', [])}
    keys = ['c-torso-bata', 'c-piernas-falda', 'c-torso-manto', 'c-peinado-mecha', 'c-cabeza-casco', 'c-cabeza-diadema',
            'c-accesorios-bolso', 'c-accesorios-brujula', 'x-cuaderno-orbital', 'x-luciernaga-observatorio', 'x-trofeo-salud',
            'c-efecto-aura', 'x-aura-amanecer', 'c-efecto-bruma', 'c-efecto-constelacion', 'c-efecto-chispas', 'x-estela-racha',
            'x-arma-destello', 'x-arma-marea', 'x-arma-sello', 'x-arma-prisma', 'x-arma-orbita']
    cols, cw, ch, pad = 6, 250, 214, 22
    rows = (len(keys) + cols - 1) // cols
    width = cols * cw + (cols + 1) * pad
    height = 94 + rows * (ch + 46) + pad
    im = Image.new('RGB', (min(width, 1600), min(height, 1600)), BG)
    d = ImageDraw.Draw(im)
    header(d, im.width, 'PRUEBA DE SILUETA · 11 PIEZAS + 11 EFECTOS', 'Máscara frontal a 256 px · caja envolvente, componentes y extremos del perfil')
    for i, pid in enumerate(keys):
        r, c = i // cols, i % cols
        x = pad + c * (cw + pad); y = 94 + r * (ch + 46)
        d.rounded_rectangle([x, y, x + cw, y + ch + 34], 9, fill=CARD, outline=LINE, width=1)
        src = os.path.join(SIL, ('effect-' + pid + '.png') if pid.startswith(('c-efecto', 'x-aura', 'x-estela', 'x-arma')) else (pid + '.png'))
        if os.path.exists(src):
            im.paste(fit(src, cw - 10, ch - 10), (x + 5, y + 5))
        p = by_id.get(pid, {})
        d.text((x + 10, y + ch + 2), pid.replace('x-arma-', 'arma · ').replace('c-', ''), font=font(11, True), fill=INK)
        if p:
            d.text((x + 10, y + ch + 17), 'box %.2f · %d formas · %d tonos · %d anim' % (p.get('boxiness', 0), len(p.get('forms', [])), len(p.get('tones', [])), len(p.get('anims', []))), font=font(8), fill=MUTED)
        d.ellipse([x + cw - 16, y + 8, x + cw - 8, y + 16], fill=TEAL)
    im.save(os.path.join(EV, 'sheet-siluetas-despues.jpg'), quality=86)
    print('sheet-siluetas-despues.jpg', im.size)


def difference():
    gate = read_json(os.path.join(QA, 'gate.json'), {})
    comp = gate.get('compare') or {}
    ids = comp.get('ids') or []
    short = {
        'c-efecto-aura': 'alba', 'x-aura-amanecer': 'amanecer', 'c-efecto-bruma': 'bruma',
        'c-efecto-constelacion': 'constelación', 'c-efecto-chispas': 'chispas',
        'x-estela-racha': 'estela', 'x-arma-destello': 'destello', 'x-arma-marea': 'marea',
        'x-arma-sello': 'sello', 'x-arma-prisma': 'prisma', 'x-arma-orbita': 'órbita'
    }
    rows = {(r['a'], r['b']): r['difference'] for r in comp.get('rows', [])}
    n = len(ids)
    cell = 92
    left = 330
    top = 250
    width = left + n * cell + 24
    height = top + n * cell + 90
    im = Image.new('RGB', (min(width, 1600), min(height, 1600)), BG)
    d = ImageDraw.Draw(im)
    header(d, im.width, 'DIFERENCIA ESTRUCTURAL ENTRE EFECTOS · 1 − IoU', 'Máscaras sólidas normalizadas · rojo < 0,35 · verde ≥ 0,45 · objetivo: ninguna firma repetida')
    # siluetas superiores
    for j, eid in enumerate(ids):
        x = left + j * cell + cell / 2
        src = os.path.join(SIL, 'effect-' + eid + '.png')
        if os.path.exists(src):
            im.paste(fit(src, cell - 26, 74), (left + j * cell + 13, 128))
        d.text((left + j * cell + 4, 208), short.get(eid, eid)[:15], font=font(8), fill=MUTED)
    for i, a in enumerate(ids):
        d.text((18, top + i * cell + cell / 2 - 6), short.get(a, a)[:30], font=font(9), fill=INK)
        for j, b in enumerate(ids):
            x = left + j * cell; y = top + i * cell
            if j <= i:
                d.rectangle([x + 2, y + 2, x + cell - 2, y + cell - 2], fill=(9, 12, 20), outline=(28, 38, 55))
                continue
            v = rows.get((a, b), rows.get((b, a), 0))
            col = (int(60 + (1 - min(1, v / 0.7)) * 180), int(40 + min(1, v / 0.7) * 170), 96)
            d.rectangle([x + 2, y + 2, x + cell - 2, y + cell - 2], fill=col, outline=LINE)
            d.text((x + 8, y + 8), '%.3f' % v, font=font(11, True), fill=(8, 12, 18) if v > 0.35 else WHITE)
    d.text((left, top + n * cell + 18), 'min: %s' % json.dumps(comp.get('min'), ensure_ascii=False), font=font(10), fill=GOLD)
    d.text((left, top + n * cell + 38), 'auraMin: %s' % json.dumps(comp.get('auraMin'), ensure_ascii=False), font=font(10), fill=GOLD)
    d.text((left, top + n * cell + 58), 'pass: %s · errores: %s' % (comp.get('pass'), comp.get('errors')), font=font(10), fill=TEAL if comp.get('pass') else RED)
    im.save(os.path.join(EV, 'sheet-diferencia-efectos.jpg'), quality=88)
    print('sheet-diferencia-efectos.jpg', im.size)


def thumbnails():
    keys = ['c-torso-bata', 'c-piernas-falda', 'c-torso-manto', 'c-peinado-mecha', 'c-cabeza-casco', 'c-cabeza-diadema',
            'c-accesorios-bolso', 'c-accesorios-brujula', 'x-cuaderno-orbital', 'x-luciernaga-observatorio', 'x-trofeo-salud']
    def part(part_keys, out_name):
        cols, cw, ch, pad = 2, 760, 180, 24
        rows = len(part_keys)
        width = 380 * 2 + 3 * pad + 360
        height = 100 + rows * (ch + 28) + pad
        im = Image.new('RGB', (min(width, 1600), min(height, 1600)), BG)
        d = ImageDraw.Draw(im)
        header(d, im.width, 'MINIATURAS REGENERADAS · TIENDA E INVENTARIO', 'Antes / después · 160 px · mismas piezas · caché nueva en cada carga')
        for i, pid in enumerate(part_keys):
            y = 94 + i * (ch + 28)
            d.text((30, y + 10), pid, font=font(11, True), fill=INK)
            for j, kind in enumerate(['before', 'after']):
                src = os.path.join(EV, 'thumbs-' + kind, pid + '.png')
                x = 380 + j * 380
                d.rectangle([x, y, x + 340, y + ch], fill=CARD, outline=LINE)
                if os.path.exists(src):
                    im.paste(fit(src, ch - 12, ch - 12), (x + 10, y + 6))
                d.text((x + 180, y + 12), 'ANTES' if kind == 'before' else 'DESPUÉS', font=font(12, True), fill=GOLD if kind == 'before' else TEAL)
        im.save(os.path.join(EV, out_name), quality=86)
        print(out_name, im.size)
    part(keys[:6], 'sheet-miniaturas-tienda-1.jpg')
    part(keys[6:], 'sheet-miniaturas-tienda-2.jpg')


if __name__ == '__main__':
    one_rarity()
    silhouettes()
    difference()
    thumbnails()
