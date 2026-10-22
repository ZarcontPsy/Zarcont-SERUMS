import pymupdf, os, glob, re, json, collections
os.makedirs('study-data/audit/digest',exist_ok=True)
for p in sorted(glob.glob('study-data/fuentes/*.pdf')):
    name=os.path.basename(p)
    d=pymupdf.open(p)
    alltext=[]; headings=[]; sizes=collections.Counter()
    for i,page in enumerate(d):
        blocks=page.get_text('dict')['blocks']
        ptext=[]
        for b in blocks:
            for l in b.get('lines',[]):
                txt=''.join(s['text'] for s in l['spans']).strip()
                if not txt: continue
                size=round(max(s['size'] for s in l['spans']),1)
                bold=any('Bold' in s['font'] or 'Black' in s['font'] for s in l['spans'])
                sizes[size]+=1
                ptext.append(txt)
                if len(txt)<130 and (size>=12.5 or (bold and size>=10.5)) and not re.match(r'^[\d\.\-\)\s]+$',txt):
                    headings.append((i+1,size,txt))
        alltext.append((i+1,'\n'.join(ptext)))
    with open('study-data/audit/digest/'+name.replace('.pdf','.txt'),'w',encoding='utf-8') as f:
        f.write(f"FILE {name} | pages {d.page_count} | chars {sum(len(t) for _,t in alltext)}\n")
        toc=d.get_toc()
        if toc:
            f.write('\n== TOC ==\n')
            for lvl,title,pg in toc[:60]: f.write(f"{'  '*(lvl-1)}p{pg}: {title}\n")
        f.write('\n== HEADINGS (candidates) ==\n')
        seen=set()
        for pg,size,txt in headings:
            key=(pg,txt)
            if key in seen: continue
            seen.add(key)
            f.write(f"p{pg} [{size}] {txt}\n")
        f.write('\n== FIRST PAGES ==\n')
        for pg,t in alltext[:4]:
            f.write(f"\n--- p{pg} ---\n{t[:3500]}\n")
    d.close()
    print('digest',name)
print('DONE')
