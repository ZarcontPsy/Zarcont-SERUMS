import pymupdf
d=pymupdf.open('study-data/fuentes/gpc-episodio-depresivo-leve.pdf')
for i in [9,10,11,12,13,20]:
    t=d[i].get_text().lower()
    print('page',i+1, 'remision' in t, 'respuesta' in t, '50' in t, 'tres semanas' in t)
