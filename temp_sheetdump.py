import json
for f in ['study-data/_add-01.json']:
    d=json.load(open(f,encoding='utf-8'))
    for s in d['sheets']:
        if s['id'] in ('sheet-adulto-07','sheet-adulto-08'):
            print(json.dumps(s,ensure_ascii=False,indent=1))
