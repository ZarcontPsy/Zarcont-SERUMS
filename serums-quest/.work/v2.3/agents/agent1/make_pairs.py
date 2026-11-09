import json, os
from PIL import Image, ImageDraw, ImageFont
OUT = r'.work/v2.3/agents/agent1'
S = os.path.join(OUT, 'shots')
pairs = [
 ('ilan','c-cabeza-diadema'), ('kian','c-cabeza-diadema'),
 ('ilan','x-arma-destello'), ('noa','x-cuaderno-orbital'),
 ('ilan','c-marco-platino'), ('kian','c-marco-platino'),
 ('noa','c-torso-bata'), ('ilan','x-trofeo-salud'),
]
cell=210; pad=8; cap=26
cols=4
rows=(len(pairs)*2+cols-1)//cols
sheet=Image.new('RGB',(cols*(cell+pad)+pad, rows*(cell+cap+pad)+pad),(11,16,32))
d=ImageDraw.Draw(sheet)
try: font=ImageFont.truetype('segoeui.ttf',13)
except Exception: font=ImageFont.load_default()
i=0
for hero,piece in pairs:
  for state in ('antes','despues'):
    f=os.path.join(S, state+'-'+hero+'-'+piece+'.png')
    if not os.path.exists(f): continue
    im=Image.open(f).convert('RGB').resize((cell,cell),Image.LANCZOS)
    x=pad+(i%cols)*(cell+pad); y=pad+(i//cols)*(cell+cap+pad)
    sheet.paste(im,(x,y))
    d.text((x,y+cell+3),(state+' · '+hero+' · '+piece)[:40],fill='#aeb8cc',font=font)
    i+=1
sheet.save(os.path.join(OUT,'hoja-casos-criticos.jpg'),quality=88,optimize=True)
print('sheet',sheet.size,'cells',i)
ev=json.load(open(os.path.join(OUT,'evidence-summary.json'),encoding='utf-8'))
rows={}
for c in ev['cases']:
  rows[(c['hero'],c['cosmetic'],c['raw'])]=c
pairs2=[(h,p) for h,p in pairs]
for h,p in pairs2:
  a=rows.get((h,p,True)); b=rows.get((h,p,False))
  print(h,p,'antes:',a and a['status'],a and a['reason'],'| despues:',b and b['status'],b and b['reason'])
aft=sum(1 for c in ev['cases'] if not c['raw'] and c['status']=='PASS')
bef=sum(1 for c in ev['cases'] if c['raw'] and c['status']=='PASS')
tot=sum(1 for c in ev['cases'] if not c['raw'])
print('antes PASS',bef,'/',tot,'despues PASS',aft,'/',tot)
