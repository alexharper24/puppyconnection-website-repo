"""Write migrations/0084, the photo clock backfill (docs/batch-2026-11-02-post-launch.md, n1-photo-clock).

Every listed puppy's last_photo_at becomes the date of its newest photo: Wix's Last-Modified for a photo
still at a Wix address, and the row's created_at for one uploaded to us. The go-live hold (photo_clock_start,
2026-11-01) stays, so the backfill alone warns nobody. The migration also turns on photo_clock_stop, so the
clock stops at the first warning, and gives the first warning to each listing already past six weeks whose
breeder has never signed in, so the portal shows it on their first sign-in. A listing past six weeks whose
breeder has signed in is warned by the next daily run instead, because only the job sends the email.

  python app/ops/photo_clock_backfill.py <production export.sql> <lm.json> <out.sql>

lm.json is the Last-Modified cache from app/.state/photoclock (dates.py). A Wix address missing from it is
asked for once with HEAD and added to it.
"""
import json, sqlite3, sys, time, urllib.request
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

dump, lm_f, out = sys.argv[1:4]
db = sqlite3.connect(':memory:')
db.executescript(open(dump, encoding='utf8').read())
lm = json.load(open(lm_f))


def last_modified(url):
    if url not in lm:
        lm[url] = None
        try:
            with urllib.request.urlopen(urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'}), timeout=30) as r:
                v = r.headers.get('Last-Modified')
                lm[url] = parsedate_to_datetime(v).astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ') if v else None
        except Exception:
            pass
        time.sleep(0.15)
    return lm[url]


gen = datetime.now(timezone.utc).replace(microsecond=0)
stamp = gen.strftime('%Y-%m-%dT%H:%M:%SZ')
six_weeks = (gen - timedelta(days=42)).strftime('%Y-%m-%dT%H:%M:%SZ')
q = lambda s: "'" + str(s).replace("'", "''") + "'"
rows = db.execute(
    """SELECT p.id, p.name, p.last_photo_at, p.inactive_stage, b.first_signin_at, b.id, ph.external_url, ph.created_at
         FROM public_puppies v JOIN puppies p ON p.id = v.id JOIN breeders b ON b.id = p.breeder_id
         JOIN photos ph ON ph.puppy_id = p.id WHERE p.availability != 'placed' ORDER BY p.id""").fetchall()
pups = {}
for pid, name, last, stage, signin, breeder, url, created in rows:
    wix = bool(url and 'wixstatic' in url)
    d = last_modified(url) if wix else created
    p = pups.setdefault(pid, {'name': name, 'last': last, 'stage': stage, 'signin': signin, 'breeder': breeder, 'newest': None, 'src': None})
    if d and (not p['newest'] or d > p['newest']):
        p['newest'], p['src'] = d, 'wix' if wix else 'portal'
json.dump(lm, open(lm_f, 'w'))

lines = [
    '-- Alex, 2026-11-01 (docs/batch-2026-11-02-post-launch.md, n1-photo-clock). Each listed puppy\'s photo clock',
    '-- (last_photo_at) moves to the date of its newest photo: Wix\'s Last-Modified for a photo still at a Wix address,',
    '-- the upload time for any other. The go-live hold (photo_clock_start 2026-11-01) stays. photo_clock_stop turns on,',
    '-- so the clock stops at the first warning and nothing goes offline or is removed until Alex lifts it. Listings',
    '-- already past six weeks whose breeder has never signed in get the first warning here, so the breeder portal shows',
    '-- it on their first sign-in; one whose breeder has signed in is warned, with the email, by the next daily run.',
    f'-- Written by app/ops/photo_clock_backfill.py from {dump.replace(chr(92), "/").split("/")[-1]}, generated {stamp}.',
    '-- Each update is guarded on the value it replaces, so a photo added since wins and a second run changes nothing.',
    '-- Nothing here is on the public site, so there is no publish marker.',
    "INSERT INTO settings (key, value) VALUES ('photo_clock_stop', '1') ON CONFLICT (key) DO NOTHING;",
    '',
]
moved = warned = 0
report = []
for pid, p in sorted(pups.items()):
    new = p['newest']
    if not new:
        continue
    if new != p['last']:
        moved += 1
        old = 'IS NULL' if p['last'] is None else f"= {q(p['last'])}"
        lines.append(f"INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)\n"
                     f"  SELECT {q(stamp)}, 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', {q(pid)}, json_object('last_photo_at', {q(p['last']) if p['last'] else 'NULL'}), json_object('last_photo_at', {q(new)}, 'source', {q(p['src'])})\n"
                     f"   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = {q(pid)} AND last_photo_at {old})\n"
                     f"     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = {q(pid)} AND action = 'puppy.photo_clock_backfill');")
        lines.append(f"UPDATE puppies SET last_photo_at = {q(new)} WHERE id = {q(pid)} AND last_photo_at {old};")
    if new <= six_weeks and not p['signin'] and not p['stage']:
        warned += 1
        guard = (f"id = {q(pid)} AND last_photo_at = {q(new)} AND inactive_stage IS NULL AND publication_state = 'published'"
                 " AND operator_hold = 0 AND availability != 'placed'")
        lines.append(f"INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)\n"
                     f"  SELECT {q(stamp)}, 'system', 'claude', 'listing.reminded_1', 'puppy', {q(pid)}, NULL, json_object('newest_photo', {q(new)}, 'note', 'overdue at the 2026-11-01 backfill, warning only')\n"
                     f"   WHERE EXISTS (SELECT 1 FROM puppies WHERE {guard});")
        lines.append(f"UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = {q(stamp)} WHERE {guard};")
    if new <= six_weeks:
        report.append(f"{new[:10]}  {p['name']}  ({p['breeder']}, {'signed in' if p['signin'] else 'never signed in'}, {p['src']})")
open(out, 'w', encoding='utf8', newline='\n').write('\n'.join(lines) + '\n')
print(f'{len(pups)} listed puppies with photos, {moved} clocks move, {warned} warned here')
print('past six weeks:\n  ' + '\n  '.join(report))
