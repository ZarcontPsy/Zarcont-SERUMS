import json,glob
allc={'sources':[],'areas':[],'topics':[],'sheets':[],'cards':[]}
for f in sorted(glob.glob('study-data/_add-*.json')):
    d=json.load(open(f,encoding='utf-8'))
    for k in allc: allc[k]+=d.get(k,[])
print({k:len(v) for k,v in allc.items()})
for src in allc['sources']:
    pages=set()
    for sh in allc['sheets']:
        for r in sh.get('sourceRefs',[]):
            if r['sourceId']==src['id']: pages.update(r['pages'])
    for ca in allc['cards']:
        for r in ca.get('sourceRefs',[]):
            if r['sourceId']==src['id']: pages.update(r['pages'])
    print(f"{src['id']:24} {len(pages):3} pages {src['file']}")
print('\nTopics:')
for t in allc['topics']:
    sh=[x for x in allc['sheets'] if x['topicId']==t['id']]
    ca=[x for x in allc['cards'] if x['topicId']==t['id']]
    print(f"{t['id']:34} {len(sh)} sheets {len(ca)} cards | {t['title']}")
print('\ncross-refs broken:')
sids={s['id'] for s in allc['sources']}; tids={t['id'] for t in allc['topics']}; shids={s['id'] for s in allc['sheets']}
for ca in allc['cards']:
    if ca['topicId'] not in tids or ca['sheetId'] not in shids: print('card',ca['id'],ca['topicId'],ca['sheetId'])
for sh in allc['sheets']:
    if sh['topicId'] not in tids: print('sheet',sh['id'],sh['topicId'])
    for r in sh.get('sourceRefs',[]):
        if r['sourceId'] not in sids: print('sheet ref',sh['id'],r['sourceId'])
