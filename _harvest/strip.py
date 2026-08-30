import sys,re,html,io
raw=open(sys.argv[1],'rb').read()
h=raw.decode('utf-8',errors='replace')
h=re.sub(r'<script\b.*?</script>','',h,flags=re.S|re.I)
h=re.sub(r'<style\b.*?</style>','',h,flags=re.S|re.I)
h=re.sub(r'<noscript\b.*?</noscript>','',h,flags=re.S|re.I)
h=re.sub(r'<(br|/p|/div|/li|/h[1-6])\s*/?>','\n',h,flags=re.I)
h=re.sub(r'<[^>]+>',' ',h)
h=html.unescape(h)
BOILER={'top of page','OUR PROCESS','PUPPIES','Tips on buying a puppy','BREED INFO',
 'ABOUT US','DELIVERY','CONTACT','BLOG','REVIEWS','More','Use tab to navigate through the menu items.',
 'Quick Links','Contact Us','HOME','PUPPIES FOR SALE','574-221-0326','info@puppy-connection.com',
 'Puppies for sale nationwide','bottom of page','-->','Search',
 'We believe that they are more than just precious paws and puppy breath...they are FAMILY'}
lines=[re.sub(r'[ \t]+',' ',l).strip() for l in h.split('\n')]
seen=set(); out=[]
for l in lines:
    if len(l)<3 or l in BOILER or l in seen: continue
    seen.add(l); out.append(l)
io.open(sys.argv[2],'w',encoding='utf-8').write('\n'.join(out))
print(len(out))
