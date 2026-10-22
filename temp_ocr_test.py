import time, pymupdf
from rapidocr_onnxruntime import RapidOCR
p='study-data/fuentes/tamizaje-neonatal.pdf'
d=pymupdf.open(p)
eng=RapidOCR()
for i in [0,1,2]:
    t=time.time(); pix=d[i].get_pixmap(dpi=130, colorspace=pymupdf.csGRAY); img=pix.tobytes('png')
    res,_=eng(img)
    print('page',i+1,'secs',round(time.time()-t,2),'lines',len(res or []))
    print(' | '.join(x[1] for x in (res or [])[:12]))
