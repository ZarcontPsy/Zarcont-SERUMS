import json, glob, os, re, unicodedata, collections, pymupdf
base=json.load(open('temp_temario.json',encoding='utf-8'))
content={k:list(base.get(k,[])) for k in ['sources','areas','topics','sheets','cards']}
for f in sorted(glob.glob('study-data/_add-*.json')):
    d=json.load(open(f,encoding='utf-8'))
    for k in content: content[k]+=d.get(k,[])
issues=[]; warns=[]
def norm(s): return re.sub(r'[^a-z0-9áéíóúüñ ]','',unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode()).strip()
# page counts
pages={}
for src in content['sources']:
    p=os.path.normpath(os.path.join('study-data',src['file'].replace('../study-data/','')))
    if not os.path.exists(p): issues.append(f"source file missing {src['id']} {p}"); continue
    d=pymupdf.open(p); pages[src['id']]=d.page_count; d.close()
# unique ids per collection
for k in content:
    ids=[x['id'] for x in content[k]]
    dup=[i for i,n in collections.Counter(ids).items() if n>1]
    if dup: issues.append(f"duplicate {k} ids {dup}")
ids={k:{x['id'] for x in content[k]} for k in content}
for s in content['sources']:
    if not s.get('file'): issues.append(f"source no file {s['id']}")
    if not s.get('title'): issues.append(f"source no title {s['id']}")
for a in content['areas']:
    for sid in a.get('sourceIds',[]):
        if sid not in ids['sources']: issues.append(f"area {a['id']} bad source {sid}")
    if not any(t['areaId']==a['id'] for t in content['topics']): warns.append(f"area no topics {a['id']}")
for t in content['topics']:
    if t['areaId'] not in ids['areas']: issues.append(f"topic {t['id']} bad area {t['areaId']}")
    for sid in t.get('sourceIds',[]):
        if sid not in ids['sources']: issues.append(f"topic {t['id']} bad source {sid}")
    if not any(s['topicId']==t['id'] for s in content['sheets']): issues.append(f"topic no sheets {t['id']}")
    if not any(c['topicId']==t['id'] for c in content['cards']): issues.append(f"topic no cards {t['id']}")
for s in content['sheets']:
    if s['topicId'] not in ids['topics']: issues.append(f"sheet {s['id']} bad topic {s['topicId']}")
    if s['areaId'] not in ids['areas']: issues.append(f"sheet {s['id']} bad area {s['areaId']}")
    if not s.get('sourceRefs'): issues.append(f"sheet {s['id']} no refs")
    for r in s.get('sourceRefs',[]):
        if r['sourceId'] not in ids['sources']: issues.append(f"sheet {s['id']} bad ref {r['sourceId']}"); continue
        for pg in r['pages']:
            if not (1<=pg<=pages.get(r['sourceId'],0)): issues.append(f"sheet {s['id']} page out of range {r['sourceId']} p{pg}/{pages.get(r['sourceId'])}")
    if len(s.get('keyConcepts',[]))<3: warns.append(f"sheet {s['id']} few concepts {len(s.get('keyConcepts',[]))}")
    if len(s.get('sections',[]))<2: issues.append(f"sheet {s['id']} few sections {len(s.get('sections',[]))}")
    for sec in s.get('sections',[]):
        if not sec.get('title'): issues.append(f"sheet {s['id']} section no title")
        if not (sec.get('body') or sec.get('bullets') or sec.get('table') or sec.get('callout')): issues.append(f"sheet {s['id']} empty section {sec.get('title')}")
        if sec.get('depth') not in ('core','full',''): warns.append(f"sheet {s['id']} depth {sec.get('depth')}")
    if s['topicId'] not in ids['topics']: continue
    topic=next(t for t in content['topics'] if t['id']==s['topicId'])
    if topic['areaId']!=s['areaId']: issues.append(f"sheet {s['id']} area mismatch")
for c in content['cards']:
    if c['topicId'] not in ids['topics']: issues.append(f"card {c['id']} bad topic {c['topicId']}")
    if c['sheetId'] not in ids['sheets']: issues.append(f"card {c['id']} bad sheet {c['sheetId']}")
    if not c.get('prompt'): issues.append(f"card {c['id']} no prompt")
    if len(c.get('explanation',''))<20: warns.append(f"card {c['id']} short explanation")
    if c['type']=='multiple':
        opts=c.get('options',[]); ci=c.get('correctIndex')
        if len(opts)<3: issues.append(f"card {c['id']} options {len(opts)}")
        if not isinstance(ci,int) or not (0<=ci<len(opts)): issues.append(f"card {c['id']} bad correctIndex {ci}")
        if len(set(opts))!=len(opts): issues.append(f"card {c['id']} duplicate options")
    elif c['type']=='concept':
        if not c.get('answer'): issues.append(f"card {c['id']} no answer")
    elif c['type']=='application':
        if not c.get('options') or not isinstance(c.get('correctIndex'),int): issues.append(f"card {c['id']} application missing options")
    else: issues.append(f"card {c['id']} unknown type {c['type']}")
    if not c.get('sourceRefs'): warns.append(f"card {c['id']} no refs")
    for r in c.get('sourceRefs',[]):
        if r['sourceId'] not in ids['sources']: issues.append(f"card {c['id']} bad ref {r['sourceId']}"); continue
        for pg in r['pages']:
            if not (1<=pg<=pages.get(r['sourceId'],0)): issues.append(f"card {c['id']} page out of range {r['sourceId']} p{pg}")
    if c['sheetId'] in ids['sheets']:
        sh=next(x for x in content['sheets'] if x['id']==c['sheetId'])
        if sh['topicId']!=c['topicId']: issues.append(f"card {c['id']} topic/sheet mismatch")
# duplicate prompts
pm=collections.defaultdict(list)
for c in content['cards']: pm[norm(c['prompt'])].append(c['id'])
for p,cs in pm.items():
    if len(cs)>1: warns.append('duplicate prompt: '+', '.join(cs))
# IDs in sheet source refs but not topic sources
print('COUNTS', {k:len(v) for k,v in content.items()})
print('ISSUES',len(issues))
for x in issues: print(' ERROR',x)
print('WARNINGS',len(warns))
for x in warns[:80]: print(' WARN',x)
print('MC correct distribution', collections.Counter(c.get('correctIndex') for c in content['cards'] if c['type'] in ('multiple','application')))
