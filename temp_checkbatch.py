import json
d=json.load(open('study-data/audit/gen/batch-seguridad.json',encoding='utf-8'))
print({k:len(v) for k,v in d.items()})
for s in d['sheets']:
    print('\n###',s['id'],s['title'])
    print('SUMMARY',s['summary'])
    print('KEYS',s['keyConcepts'])
    print('REFS',s['sourceRefs'])
    for sec in s['sections']:
        print(' -',sec['title'],'|',sec.get('body') or sec.get('bullets') or sec.get('table'))
for c in d['cards'][:6]:
    print('\nCARD',c['type'],c['prompt'])
    print('ANS',c.get('answer') or c.get('options'))
    print('CI',c.get('correctIndex'),'EXP',c['explanation'])
