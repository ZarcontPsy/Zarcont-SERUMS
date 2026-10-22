import pymupdf, os, json, time
from rapidocr_onnxruntime import RapidOCR
files=['tamizaje-neonatal.pdf','vigilancia-iaas.pdf','instituciones-educativas-saludables.pdf','labor-agente-comunitario-salud.pdf','enfermedades-raras-huerfanas.pdf','gpc-climaterio-menopausia.pdf']
os.makedirs('study-data/audit/ocr',exist_ok=True)
eng=RapidOCR()
for fn in files:
    p='study-data/fuentes/'+fn
    d=pymupdf.open(p)
    out=[]
    for i in range(min(8,d.page_count)):
        t=time.time()
        pix=d[i].get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
        res,_=eng(pix.tobytes('png'))
        lines=[x[1] for x in (res or [])]
        out.append({'page':i+1,'text':'\n'.join(lines)})
        print(fn,i+1,'secs',round(time.time()-t,1),flush=True)
    json.dump(out,open('study-data/audit/ocr/'+fn.replace('.pdf','.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    d.close()
print('DONE')
