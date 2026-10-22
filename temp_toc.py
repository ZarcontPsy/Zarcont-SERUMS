import pymupdf, glob, os
for p in sorted(glob.glob('study-data/fuentes/*.pdf')):
    d=pymupdf.open(p)
    toc=d.get_toc()
    if toc:
        print('\n###',os.path.basename(p),d.page_count,'pages')
        for lvl,title,page in toc[:40]: print('  '*max(0,lvl-1)+f'- p{page}: {title}')
    d.close()
