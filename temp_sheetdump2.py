import json
for f in ['temp_temario.json','study-data/_add-01.json']:
    d=json.load(open(f,encoding='utf-8'))
    for s in d['sheets']:
        if s['id'] in ('sheet-audit-06','sheet-depresion-02','sheet-depresion-06','sheet-aps-02','sheet-aps-03'):
            print('\n###',s['id'],s['title'])
            print(s['summary'])
            for sec in s['sections']:
                print('-',sec['title'],'::',sec.get('body',sec.get('bullets','')))
            print('REFS',s['sourceRefs'])
