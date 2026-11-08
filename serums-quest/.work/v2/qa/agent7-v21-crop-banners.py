# -*- coding: utf-8 -*-
import os
from PIL import Image
EV = r'.work/v2/evidence'
areas = ['salud-publica','cuidado-integral','etica','investigacion','gestion']
for mode in ['base','final']:
    removed = []
    for f in os.listdir(EV):
        if f.startswith('agent7-v21-%s-estandarte-' % mode) and ('-close-izq' in f or '-close-der' in f):
            os.remove(os.path.join(EV, f)); removed.append(f)
    for area in areas:
        src = os.path.join(EV, 'agent7-v21-%s-estandarte-%s.png' % (mode, area))
        if not os.path.exists(src):
            print('missing', src); continue
        im = Image.open(src).convert('RGB')
        dpr = im.width / 1280.0
        box = (int(330*dpr), int(180*dpr), int(630*dpr), int(480*dpr))
        crop = im.crop(box)
        crop = crop.resize((crop.width*2, crop.height*2), Image.LANCZOS)
        out = os.path.join(EV, 'agent7-v21-%s-estandarte-%s-close.png' % (mode, area))
        crop.save(out)
        print('close', out, im.size, '->', crop.size)
    print(mode, 'removed old', len(removed))
