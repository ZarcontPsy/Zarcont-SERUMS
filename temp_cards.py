import json,glob,collections,re
cards=[]
for f in ['temp_temario.json']+sorted(glob.glob('study-data/_add-*.json')):
    cards+=json.load(open(f,encoding='utf-8')).get('cards',[])
for typ in ('multiple','application'):
    cs=[c for c in cards if c.get('type')==typ]
    print(typ,len(cs),collections.Counter(c.get('correctIndex') for c in cs))
    for c in cs[:3]: print(' ',c['id'],c['prompt'],c['options'],c['correctIndex'])
