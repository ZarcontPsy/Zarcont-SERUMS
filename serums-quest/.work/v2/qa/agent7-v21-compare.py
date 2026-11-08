# -*- coding: utf-8 -*-
import os
from PIL import Image, ImageDraw, ImageFont
EV = r'serums-quest/.work/v2/evidence'
heroes = ['ilan','mara','noa','teo','lia','kian','amaru','ona','iris','zenon']
def font(sz):
    for n in ('arial.ttf','segoeui.ttf','DejaVuSans.ttf'):
        try: return ImageFont.truetype(n, sz)
        except Exception: pass
    return ImageFont.load_default()
def cell(path, w=260):
    if not os.path.exists(path): return None
    im = Image.open(path).convert('RGB')
    r = w / im.width
    return im.resize((w, int(im.height*r)), Image.LANCZOS)
def build(kind, base_tpl, final_tpl, out, title):
    rows=[]
    for h in heroes:
        b=cell(os.path.join(EV, base_tpl.format(h=h)))
        f=cell(os.path.join(EV, final_tpl.format(h=h)))
        rows.append((h,b,f))
    cw=260; ch=max((r[1].height if r[1] else 0) for r in rows)
    W=2*cw+60; H=len(rows)*(ch+30)+50
    canvas=Image.new('RGB',(W,H),(10,14,22)); d=ImageDraw.Draw(canvas)
    d.text((12,12),title,fill=(230,230,235),font=font(18))
    for i,(h,b,f) in enumerate(rows):
        y=50+i*(ch+30)
        d.text((6,y+4),h,fill=(180,190,205),font=font(14))
        if b: canvas.paste(b,(40,y))
        if f: canvas.paste(f,(40+cw+20,y))
        d.text((40,y+ch+2),'V2.0 base',fill=(150,150,160),font=font(11))
        d.text((40+cw+20,y+ch+2),'V2.1 final',fill=(150,180,150),font=font(11))
    canvas.save(out,'PNG'); print(out, canvas.size)
build('normal', 'agent7-v21-base-parpadeo-{h}-a.png', 'agent7-v21-final-parpadeo-front-{h}.png',
      os.path.join(EV,'agent7-v21-compare-fronts.png'), 'SERUMS QUEST V2.1 · antes/después · 10 héroes frontal (sin cosmético)')
build('cosmetico', 'agent7-v21-base-parpadeo-cosmetico-{h}-a.png', 'agent7-v21-final-parpadeo-cosmetico-front-{h}.png',
      os.path.join(EV,'agent7-v21-compare-fronts-cosmeticos.png'), 'SERUMS QUEST V2.1 · antes/después · 10 héroes frontal (con gafas)')
