import io
for f in ['study-data/_add-01.json','study-data/_add-02.json','study-data/_add-03.json','study-data/_add-04.json']:
    b=open(f,'rb').read()
    s=b.decode('utf-8',errors='replace')
    print(f, 'replacement', s.count('\ufffd'), 'utf8 ok', end=' ')
    try:
        b.decode('utf-8'); print('yes')
    except: print('no')
    i=s.find('Ministerio')
    print(repr(s[i:i+60]))
