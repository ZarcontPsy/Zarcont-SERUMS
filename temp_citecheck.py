import json,glob,os,re,unicodedata,pymupdf
keys=['sources','areas','topics','sheets','cards']
c=json.load(open('temp_temario.json',encoding='utf-8'))
for f in sorted(glob.glob('study-data/_add-*.json')):
    d=json.load(open(f,encoding='utf-8'))
    for k in keys: c[k]+=d.get(k,[])
d=json.load(open('study-data/audit/gen/batch-seguridad.json',encoding='utf-8'))
for k in keys: c[k]+=d.get(k,[])
texts={}
for src in c['sources']:
    path=os.path.normpath(os.path.join('study-data',src['file'].replace('../study-data/','')))
    if not os.path.exists(path): continue
    doc=pymupdf.open(path)
    texts[src['id']]=[p.get_text().lower() for p in doc]
    doc.close()
stop=set('para desde sobre entre cuando donde porque aunque tambien segun durante mediante incluye puede debe hacer tiene sido esta este estos estas sera solo como mas pero cada otra otro todo toda todos todas atencion salud persona personas equipo servicio servicios clinica clinico primer nivel deben realiza realizar'.split())
def words(s):
    s=unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode()
    return [w for w in re.findall(r'[a-z]{6,}',s) if w not in stop]
flagged=[]
for sh in c['sheets']:
    refs=sh.get('sourceRefs',[])
    if not refs: continue
    src=refs[0]['sourceId']
    if src not in texts: continue
    pages=set()
    for r in refs: pages.update(r['pages'])
    body=' '.join([sh.get('title',''),sh.get('summary','')]+sh.get('keyConcepts',[]))
    ws=[]
    for w in words(body):
        if w not in ws: ws.append(w)
    ws=ws[:12]
    if not ws or not pages: continue
    alltext=' '.join(texts[src][p-1] for p in pages if 0<p<=len(texts[src]))
    hit=[w for w in ws if w in alltext]
    ratio=len(hit)/len(ws)
    if ratio<0.5:
        flagged.append((ratio,sh['id'],src,sorted(pages),[w for w in ws if w not in alltext]))
for x in sorted(flagged): print(f"{x[0]:.2f} {x[1]:24} {x[2]:14} p{x[3]} missing {x[4]}")
print('flagged',len(flagged),'of',len(c['sheets']))
