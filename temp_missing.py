import json,glob,os
c=json.load(open('temp_temario.json',encoding='utf-8'))
used={os.path.basename(s['file']) for s in c['sources']}
for f in glob.glob('study-data/_add-*.json'):
    for s in json.load(open(f,encoding='utf-8'))['sources']:
        used.add(os.path.basename(s['file']))
allpdf={os.path.basename(p) for p in glob.glob('study-data/fuentes/*.pdf')}
print('used',len(used),'all',len(allpdf))
print('MISSING:')
for x in sorted(allpdf-used): print(' ',x)
