import sys,re,json,html,io,os
def parse(path,slug):
    raw=open(path,'rb').read().decode('utf-8',errors='replace')
    o={'slug':slug}
    prod=None
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>',raw,re.S):
        try: d=json.loads(m.group(1))
        except Exception: continue
        for c in (d if isinstance(d,list) else [d]):
            if isinstance(c,dict) and c.get('@type')=='Product': prod=c
    if not prod: return None
    o['name']=prod.get('name')
    off=prod.get('offers') or {}
    if isinstance(off,list): off=off[0] if off else {}
    o['price']=int(off['price']) if off.get('price') else None
    o['in_stock']=(off.get('availability','').split('/')[-1]=='InStock')
    d=prod.get('description') or ''
    d=re.sub(r'<[^>]+>','\n',d); d=html.unescape(d)
    lines=[re.sub(r'\s+',' ',l).strip() for l in d.split('\n')]
    lines=[l for l in lines if l]
    body=' '.join(lines)
    def grab(pat):
        m=re.search(pat,body,re.I)
        return m.group(1).strip(' -:') if m else None
    o['birthdate']   = grab(r'Birth\s*date\s*[-:]?\s*([A-Z][a-z]+ \d{1,2},? \d{4})')
    o['ready_date']  = grab(r'Ready to go\s*[-:]?\s*([A-Z][a-z]+ \d{1,2},? \d{4})')
    o['deposit']     = grab(r'Deposit\s*[-:]?\s*\$?([\d,]+)')
    o['mom_weight']  = grab(r"Mom'?s weight\s*[-:]?\s*([\w. ]{1,14}lbs)")
    o['dad_weight']  = grab(r"Dad'?s weight\s*[-:]?\s*([\w. ]{1,14}lbs)")
    o['breeder_phone']= grab(r'Call/?Text\s*[-:]?\s*([\d)( .-]{10,16})')
    o['breeder_email']= grab(r'Email\s*[-:]?\s*([\w.+-]+@[\w.-]+\.\w+)')
    o['hypoallergenic']= bool(re.search(r'hypoallergenic',body,re.I))
    m=re.search(r'What I come home with\s*:?(.*?)(?:Call/?Text|Email|Website|$)',body,re.I|re.S)
    if m:
        items=[x.strip() for x in re.split(r'\s{2,}|(?<=[a-z])(?=[A-Z][a-z])',m.group(1)) if 2<len(x.strip())<60]
        o['includes']=items[:10]
    o['description']=body[:1400]
    urls=[]
    im=prod.get('image') or []
    if isinstance(im,dict): im=[im]
    for i in im:
        u=i.get('contentUrl') if isinstance(i,dict) else i
        if not u: continue
        base=re.sub(r'/v1/.*$','',u)
        big=base+'/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg'
        if big not in urls: urls.append(big)
    o['images']=urls[:10]
    b=re.findall(r'https?://(?:www\.)?([a-z0-9-]{5,}\.(?:com|net))',raw)
    b=[x for x in b if not re.search(r'wix|parastorage|puppy-connection|google|facebook|instagram|filesusr|youtube|calendly|appspot|cloudfront|schema|crazyegg|thunderbolt',x)]
    o['breeder_domain']=b[0] if b else None
    return o
if __name__=='__main__':
    r=parse(sys.argv[1],sys.argv[2])
    if r: io.open(sys.argv[3],'w',encoding='utf-8').write(json.dumps(r,ensure_ascii=False))
