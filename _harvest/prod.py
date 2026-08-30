import sys,re,json,html
raw=open(sys.argv[1],'rb').read().decode('utf-8',errors='replace')
out={'slug':sys.argv[2]}
prod=None
for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>',raw,re.S):
    try: d=json.loads(m.group(1))
    except Exception: continue
    for c in (d if isinstance(d,list) else [d]):
        if isinstance(c,dict) and c.get('@type')=='Product': prod=c
if prod:
    out['name']=prod.get('name')
    off=prod.get('offers') or {}
    if isinstance(off,list): off=off[0] if off else {}
    out['price']=off.get('price')
    out['availability']=(off.get('availability') or '').split('/')[-1]
    d=prod.get('description') or ''
    d=re.sub(r'<[^>]+>',' ',d); d=html.unescape(d); d=re.sub(r'\s+',' ',d).strip()
    out['description']=d[:1500]
    im=prod.get('image') or []
    if isinstance(im,dict): im=[im]
    urls=[]
    for i in im:
        u=i.get('url') if isinstance(i,dict) else i
        if u and u not in urls: urls.append(u)
    out['images']=urls[:12]
b=re.findall(r'https?://(?:www\.)?([a-z0-9-]{5,}\.(?:com|net))',raw)
b=[x for x in b if not re.search(r'wix|parastorage|puppy-connection|google|facebook|instagram|filesusr|youtube|calendly|appspot|cloudfront|schema|crazyegg|thunderbolt',x)]
out['breeder_domain']=b[0] if b else None
print(json.dumps(out,ensure_ascii=False))
