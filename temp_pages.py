import pymupdf
checks=[('study-data/fuentes/cuidado-integral-persona-adulta.pdf',[37,38,40],'sheet-adulto-08'),('study-data/fuentes/audit-consumo-alcohol.pdf',[24,25,26],'sheet-audit-06'),('study-data/fuentes/gpc-episodio-depresivo-leve.pdf',[10,21],'sheet-depresion-02'),('study-data/fuentes/gpc-episodio-depresivo-leve.pdf',[10,12,13],'sheet-depresion-06'),('study-data/fuentes/atencion-primaria-salud.pdf',[2,3,4],'sheet-aps-02')]
for f,pages,label in checks:
    d=pymupdf.open(f)
    print('\n====',label)
    for p in pages:
        t=d[p-1].get_text()
        print(f'--- p{p} ---')
        print(t[:1200].replace('\n',' '))
    d.close()
