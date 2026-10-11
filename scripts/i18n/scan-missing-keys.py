# Report translation keys used in code that are not defined in any en-us / pt-br file.
# Usage (from the repository root): python3 scripts/i18n/scan-missing-keys.py packages/storefront/addon
import yaml,re,glob,sys
src=sys.argv[1]
def fl(d,pre=''):
    for k,v in d.items():
        if isinstance(v,dict): yield from fl(v,pre+str(k)+'.')
        else: yield pre+str(k),v
res={}
for loc in ['en-us','pt-br']:
    allk={}
    for p in glob.glob('packages/*/translations/%s.yaml'%loc)+['console/translations/%s.yaml'%loc]:
        try: allk.update(dict(fl(yaml.safe_load(open(p)))))
        except Exception: pass
    miss={}
    for f in glob.glob(src+'/**/*.*',recursive=True):
        if not f.endswith(('.js','.hbs')): continue
        s=re.sub(r'\{\{!--.*?--\}\}','',open(f).read(),flags=re.S)
        for k in re.findall(r'(?:\(t |\{\{t |intl\.t\(|label\()[\x27"]([a-z][\w-]*\.[\w.-]+)[\x27"]',s):
            if k not in allk and not k.endswith('.'): miss.setdefault(k,set()).add(f.replace(src+'/',''))
    res[loc]=miss
en,pt=res['en-us'],res['pt-br']
print('missing en',len(en),'| missing only pt',len(set(pt)-set(en)))
for k in sorted(en): print(k,'<-',', '.join(sorted(en[k]))[:110])
for k in sorted(set(pt)-set(en)): print('PT-ONLY',k,'<-',', '.join(sorted(pt[k]))[:110])
