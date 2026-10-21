# © 2026 ZARCONT — OCR de apoyo para las fuentes escaneadas de Study.
# Uso: python ocr_scanned.py <pdf> <salida.json>
# No forma parte del runtime de las aplicaciones.
import json
import os
import sys
import time

import pymupdf
from rapidocr_onnxruntime import RapidOCR


def main() -> int:
    if len(sys.argv) != 3:
        print("Uso: python ocr_scanned.py <pdf> <salida.json>")
        return 2
    pdf_path, out_path = sys.argv[1], sys.argv[2]
    doc = pymupdf.open(pdf_path)
    engine = RapidOCR()
    pages = []
    started = time.time()
    prefix = os.path.splitext(os.path.basename(pdf_path))[0].replace(" ", "-").lower()
    for index, page in enumerate(doc):
        pix = page.get_pixmap(dpi=145, colorspace=pymupdf.csGRAY)
        image_path = os.path.join(os.path.dirname(out_path), f"{prefix}-{index + 1:03d}.png")
        pix.save(image_path)
        result, _ = engine(image_path)
        lines = []
        for item in result or []:
            box, text, score = item
            lines.append({"text": text, "score": float(score), "box": box})
        pages.append({"page": index + 1, "lines": lines})
        try:
            os.remove(image_path)
        except OSError:
            pass
        print(f"{os.path.basename(pdf_path)}: {index + 1}/{doc.page_count} ({time.time() - started:.1f}s)", flush=True)
    payload = {
        "file": os.path.basename(pdf_path),
        "pages": pages,
        "elapsed": round(time.time() - started, 1),
    }
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=1)
    print(f"Listo: {out_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
