import json, collections
d = json.load(open(r'AUDIT\evidencias\agent8-final\run.json', encoding='utf-8'))
print('totals', d['counts'], 'total', d['total'])
by = collections.defaultdict(collections.Counter)
for r in d['results']:
    by[r['app']][r['status']] += 1
for app, c in by.items():
    print(f"{app}: PASS={c['PASS']} FAIL={c['FAIL']} SKIP={c['SKIP']}")
print('non-pass:')
for r in d['results']:
    if r['status'] != 'PASS':
        print(r['id'], r['status'], r['error'])
