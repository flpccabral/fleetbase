"""Apply exact string replacements to files and record the translation keys they introduce.

Usage: python3 scripts/i18n/apply-edits.py path/to/spec.py

The spec file is plain Python defining:
  EDITS = [(file_path, [(old_text, new_text), ...]), ...]
  KEYS  = [(translation_key, english_text, portuguese_text), ...]

Every old_text must appear exactly once in its file, otherwise nothing is written for that file and
the script stops, so a stale spec never edits the wrong place. Keys are accumulated in
<spec>.keys.json next to the spec, ready for add-keys.py.
"""
import json, os, sys

spec = sys.argv[1]
ns = {}
exec(open(spec).read(), ns)
store = os.path.splitext(spec)[0] + '.keys.json'
keys = json.load(open(store)) if os.path.exists(store) else {}
for k, e, p in ns.get('KEYS', []):
    if k in keys and keys[k] != [e, p]:
        sys.exit('conflicting values for ' + k)
    keys[k] = [e, p]
for f, subs in ns.get('EDITS', []):
    s = open(f).read()
    for a, b in subs:
        if s.count(a) != 1:
            sys.exit('%s: expected 1 match, found %d for %r' % (f, s.count(a), a))
        s = s.replace(a, b)
    open(f, 'w').write(s)
json.dump(keys, open(store, 'w'), ensure_ascii=False, indent=1)
print('ok, %d keys in %s' % (len(keys), store))
