from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

PROJECT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RUN = os.path.join(PROJECT, '.studio', 'playtest', 'run-2026-11-06T03-39-12-783Z')
OUT_DIR = os.path.join(PROJECT, 'docs')
IMG_DIR = os.path.join(OUT_DIR, 'fase2-heroes')
os.makedirs(IMG_DIR, exist_ok=True)

HEROES = [
    ('ilan', 'Ilan Vega', 'Táctico', 'Brújula de rutas', '#7AA2FF'),
    ('mara', 'Mara Solís', 'Rastreadora', 'Bastón mapamundi', '#69D3C1'),
    ('noa', 'Noa Iturbe', 'Analista', 'Lente prismática', '#8DB7FF'),
    ('teo', 'Teo Alcázar', 'Mentor', 'Báculo de escucha', '#C49BFF'),
    ('lia', 'Lía Márquez', 'Duelista', 'Cronómetro de chispa', '#F3B562'),
    ('kian', 'Kian Ferro', 'Guardián', 'Martillo-sello', '#AEB6C8'),
    ('amaru', 'Amaru Cielo', 'Vigía', 'Linterna de ruta', '#69D3C1'),
    ('ona', 'Ona Beltrán', 'Arquitecta', 'Compás de planos', '#7AA2FF'),
    ('iris', 'Iris Calderón', 'Protectora', 'Farol de custodia', '#C49BFF'),
    ('zenon', 'Zenón Atlas', 'Cronista', 'Bastón de crónica', '#E4C07A'),
]

W, H = 1920, 1160
canvas = Image.new('RGB', (W, H), '#070b14')
# Fondo con gradiente y una malla tenue.
px = canvas.load()
for y in range(H):
    t = y / (H - 1)
    r = int(7 + 9 * t)
    g = int(11 + 13 * t)
    b = int(20 + 20 * t)
    for x in range(W):
        px[x, y] = (r, g, b)
grid = Image.new('RGBA', (W, H), (0, 0, 0, 0))
dg = ImageDraw.Draw(grid)
for x in range(0, W, 48):
    dg.line((x, 0, x, H), fill=(173, 194, 232, 9), width=1)
for y in range(0, H, 48):
    dg.line((0, y, W, y), fill=(173, 194, 232, 9), width=1)
canvas = Image.alpha_composite(canvas.convert('RGBA'), grid).convert('RGB')

# Halos de ambiente.
halo = Image.new('RGBA', (W, H), (0, 0, 0, 0))
hd = ImageDraw.Draw(halo)
hd.ellipse((1230, -180, 2080, 560), fill=(83, 116, 255, 20), outline=None)
hd.ellipse((-260, 650, 700, 1380), fill=(160, 112, 255, 15), outline=None)
halo = halo.filter(ImageFilter.GaussianBlur(100))
canvas = Image.alpha_composite(canvas.convert('RGBA'), halo).convert('RGB')

draw = ImageDraw.Draw(canvas)
F_TITLE = 'C:/Windows/Fonts/bahnschrift.ttf'
F_SERIF = 'C:/Windows/Fonts/georgia.ttf'
F_BOLD = 'C:/Windows/Fonts/segoeuib.ttf'
F_UI = 'C:/Windows/Fonts/segoeui.ttf'
F_SEMI = 'C:/Windows/Fonts/seguisb.ttf'
title_font = ImageFont.truetype(F_TITLE, 48)
serif_font = ImageFont.truetype(F_SERIF, 31)
eyebrow_font = ImageFont.truetype(F_SEMI, 16)
small_font = ImageFont.truetype(F_UI, 14)
body_font = ImageFont.truetype(F_SEMI, 13)
name_font = ImageFont.truetype(F_SERIF, 25)
class_font = ImageFont.truetype(F_SEMI, 13)
weapon_font = ImageFont.truetype(F_UI, 13)

# Cabecera.
draw.rounded_rectangle((54, 44, 70, 50), radius=3, fill='#E4C07A')
draw.text((84, 36), 'FASE 2  ·  REPARTO DEL OBSERVATORIO', font=eyebrow_font, fill='#C6D0E3')
draw.text((54, 69), 'Diez héroes, diez siluetas.', font=title_font, fill='#F3F1E9')
draw.text((54, 126), 'Close-ups para aprobar reconocibilidad, color y arma en la mano.', font=small_font, fill='#94A2BC')
draw.text((1866, 45), '10 / 10', font=title_font, fill='#E4C07A', anchor='ra')
draw.text((1866, 101), 'héroes del observatorio', font=body_font, fill='#8190A9', anchor='ra')

# Tarjetas.
canvas = canvas.convert('RGBA')
CARD_W, CARD_H = 348, 430
GAP = 18
LEFT, TOP = 54, 180
for i, (hero_id, name, klass, weapon, accent) in enumerate(HEROES):
    col = i % 5
    row = i // 5
    x = LEFT + col * (CARD_W + GAP)
    y = TOP + row * (CARD_H + 18)
    accent_rgb = tuple(int(accent[j:j + 2], 16) for j in (1, 3, 5))

    card = Image.new('RGBA', (CARD_W, CARD_H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    # Glow interior.
    cd.ellipse((44, 36, CARD_W - 44, 300), fill=(*accent_rgb, 23))
    cd.rounded_rectangle((0, 0, CARD_W - 1, CARD_H - 1), radius=17, fill=(13, 19, 31, 238), outline=(37, 50, 73, 235), width=1)
    cd.rounded_rectangle((14, 0, CARD_W - 15, 3), radius=2, fill=(*accent_rgb, 210))
    cd.text((18, 16), f'{i + 1:02d}', font=small_font, fill=(*accent_rgb, 215))
    # Orbe y retrato.
    portrait = Image.open(os.path.join(RUN, f'personaje_{hero_id}.png')).convert('RGBA')
    bbox = portrait.getbbox()
    if bbox:
        portrait = portrait.crop(bbox)
    portrait.thumbnail((316, 316), Image.Resampling.LANCZOS)
    card.alpha_composite(portrait, ((CARD_W - portrait.width) // 2, 20 + (316 - portrait.height) // 2))
    cd.text((22, 348), name, font=name_font, fill='#F1F1E8')
    cd.text((22, 380), f'{klass}   ·   {weapon}', font=class_font, fill=(*accent_rgb, 235))
    cd.line((22, 405, CARD_W - 22, 405), fill=(255, 255, 255, 22), width=1)
    cd.text((22, 414), 'Modelo voxel + arma de firma', font=small_font, fill='#62708A')
    canvas.alpha_composite(card, (x, y))

    # Copia individual limpia en docs.
    portrait.save(os.path.join(IMG_DIR, f'{i + 1:02d}-{hero_id}.png'))

# Re-componer sobre RGB si el canvas es RGBA.
if canvas.mode == 'RGBA':
    bg = Image.new('RGB', canvas.size, '#070b14')
    bg.paste(canvas, mask=canvas.split()[3])
    canvas = bg

draw = ImageDraw.Draw(canvas)
draw.text((54, 1088), 'SERUMS QUEST  ·  Observatorio de las Cinco Rutas', font=small_font, fill='#6E7C96')
draw.text((54, 1114), 'Los diez modelos se dibujan en código con piezas voxel y comparten el mismo sistema de animación.', font=small_font, fill='#53627D')
draw.text((1866, 1100), 'FASE 2  ·  APROBACIÓN DE ARTE', font=eyebrow_font, fill='#8D7752', anchor='ra')

canvas.save(os.path.join(OUT_DIR, 'fase2-closeups.jpg'), quality=93)
print('saved', os.path.join(OUT_DIR, 'fase2-closeups.jpg'), canvas.size)
