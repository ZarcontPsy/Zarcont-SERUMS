import json,glob,re,collections
texts=[]
for f in ['temp_temario.json']+sorted(glob.glob('study-data/_add-*.json')):
    d=json.load(open(f,encoding='utf-8'))
    for key in ['sources','topics','sheets','cards']:
        for x in d.get(key,[]):
            texts.append(json.dumps(x,ensure_ascii=False))
s='\n'.join(texts)
words=re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+",s)
c=collections.Counter(w.lower() for w in words)
# English/common suspicious
susp=['lack','the','and','with','health','care','screening','test','score','follow','up','primary','settings','evidence','risk','alcohol','drink','patient','treatment','brief','intervention','policy','community','school','water','nutrition','breast','child','adult','mental','violence','pregnancy','birth','newborn','hepatitis','syphilis','hiv','sti','tb','hypertension','diabetes','cancer','obesity','anemia','vaccine','vaccination','infection','disease']
print('Suspicious English tokens:')
for w in susp:
    if c[w]: print(w,c[w])
print('\nRare tokens (freq<=2, len>=5):')
for w,n in sorted(c.items()):
    if n<=2 and len(w)>=5 and w not in ('para','desde','sobre','entre','cuando','donde','porque','aunque','también','según','durante','mediante','incluye','puede','debe','hacer','tiene','sido','esta','este','estos','estas','será','solo','como','más','pero','cada','otra','otro','todo','toda','todos','todas'):
        pass
print('total unique',len(c))
