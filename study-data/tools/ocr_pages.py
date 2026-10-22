# © 2026 ZARCONT — OCR acotado de páginas para auditoría de Study.
# Uso: python ocr_pages.py <pdf> <primera_pagina> <ultima_pagina> <salida.json>
# Las páginas son 1-based. No forma parte del runtime de las aplicaciones.
import json
import os
import sys
import time

import pymupdf
from rapidocr_onnxruntime import RapidOCR


def main() -> int:
    if len(sys.argv) != 5:
        print("Uso: python ocr_pages.py <pdf> <primera> <ultima> <salida.json>")
        return 2
    pdf_path = sys.argv[1]
    first = max(1, int(sys.argv[2]))
    last = int(sys.argv[3])
    out_path = sys.argv[4]
    doc = pymupdf.open(pdf_path)
    last = min(last, doc.page_count)
    engine = RapidOCR()
    pages = []
    started = time.time()
    for number in range(first, last + 1):
        page = doc[number - 1]
        pix = page.get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
        result, _ = engine(pix.tobytes("png"))
        lines = [item[1] for item in (result or [])]
        pages.append({"page": number, "text": "\n".join(lines)})
        print(f"{os.path.basename(pdf_path)}: {number}/{last} ({time.time() - started:.1f}s)", flush=True)
    payload = {"file": os.path.basename(pdf_path), "pages": pages}
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=1)
    print(f"Listo: {out_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
