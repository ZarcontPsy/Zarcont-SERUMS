import pymupdf,re
out=[]
for f in ['study-data/fuentes/gt-nutricion-ninos-0-11-anterior.pdf','study-data/fuentes/gt-nutricion-ninos-0-11.pdf']:
    d=pymupdf.open(f)
    txt=' '.join(p.get_text() for p in d)
    norm=re.sub(r'\s+',' ',txt).strip()
    out.append(norm)
    print(f, 'pages',d.page_count,'chars',len(norm),'title', (d.metadata or {}).get('title'))
    print('first',norm[:300].encode('ascii','replace').decode())
    d.close()
import difflib
print('similarity', difflib.SequenceMatcher(None,out[0][:20000],out[1][:20000]).ratio())
