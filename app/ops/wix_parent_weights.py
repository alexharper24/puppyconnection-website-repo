"""Fill the mom and dad weights the import missed, from the Wix product descriptions (Alex, 2026-11-14,
docs/batch-2026-11-14-wix-parent-weights.md).

  python -X utf8 app/ops/wix_parent_weights.py <descriptions.json> <litters-now.json> <out folder> <out.sql>

descriptions.json comes from hs-seo-data/.../fetch_descriptions.py, and litters-now.json is a production read of the
imported litters (wrangler --json). A weight is read only from the "Mom's information" or "Dad's information" block, or a
"Mom's weight" or "Dad's weight" line, as one number of pounds (pounds, pound, lbs or lb). A range, another unit or a
missing number reads as nothing. A litter takes a weight only where it has none, and only where every puppy of the
litter that gives one gives the same number. Writes weights-plan.json to the out folder (filled, differing, skipped)
and the migration, each write guarded on the weight still being empty, with an audit row and the publish marker first.
"""
import collections, json, os, re, sys
from datetime import datetime, timezone

descs = json.load(open(sys.argv[1], encoding='utf8'))
lit = {l['id']: l for l in json.load(open(sys.argv[2], encoding='utf8'))[0]['results']}
out_dir, out_sql = sys.argv[3], sys.argv[4]
T = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
NUM = r'(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)'  # Wix runs words together, as in "21 poundsColor"


def block(d, who):
    """The text of one parent's block, up to the other parent's block or the puppy's own details."""
    other = 'dad' if who == 'mom' else 'mom'
    m = re.search(rf"(?i)\b{who}'?s?\s+information(.*?)(?={other}'?s?\s+(?:information|weight)|puppy'?s?\s+colou?r|$)", d, re.S)
    if m:
        return m.group(1)
    m = re.search(rf"(?i)\b{who}'?s?\s+weight\s*[:\-]?\s*([^\n]{{0,40}})", d)
    return 'weight: ' + m.group(1) if m else None


def weight(d, who):
    b = block(d or '', who)
    if b is None:
        return None, None
    m = re.search(r'(?i)weight\s*[:\-]?\s*([^\n]{0,40})', b)
    raw = m.group(1).strip() if m else ''
    # "4 1/2 pounds" is 4.5 pounds.
    raw = re.sub(r'^(\d+)\s+(\d)/(\d)\b', lambda f: repr(int(f.group(1)) + int(f.group(2)) / int(f.group(3))), raw)
    if re.search(r'\d\s*(?:-|–|to)\s*\d', raw):
        return None, raw
    n = re.match(r'(?i)\s*' + NUM, raw)
    return (float(n.group(1)) if n else None), raw


per = collections.defaultdict(lambda: {'mom': collections.Counter(), 'dad': collections.Counter(), 'puppies': [], 'unread': []})
for d in descs:
    if d['litter_id'] not in lit:
        continue
    g = per[d['litter_id']]
    g['puppies'].append(d['name'])
    for who in ('mom', 'dad'):
        w, raw = weight(d['description'], who)
        if w is not None:
            g[who][w] += 1
        elif raw:
            g['unread'].append(f"{d['name']} {who}: {raw}")

fill, differ, skipped = [], [], []
for lid, g in sorted(per.items()):
    L = lit[lid]
    for who, col in (('mom', 'mom_weight_lb'), ('dad', 'dad_weight_lb')):
        vals = g[who]
        if not vals:
            continue
        if len(vals) > 1:
            skipped.append({'litter_id': lid, 'who': who, 'values': dict(vals), 'why': 'puppies of this litter give different weights'})
            continue
        w = next(iter(vals))
        if L[col] is None:
            fill.append({'litter_id': lid, 'breeder_id': L['breeder_id'], 'col': col, 'weight': w, 'puppies': g['puppies'], 'public': L['pub']})
        elif float(L[col]) != w:
            differ.append({'litter_id': lid, 'who': who, 'site': L[col], 'wix': w})
json.dump({'generated': T, 'fill': fill, 'differ': differ, 'skipped': skipped,
           'unread': {lid: g['unread'] for lid, g in per.items() if g['unread']}},
          open(os.path.join(out_dir, 'weights-plan.json'), 'w', encoding='utf8'), indent=1)

q = lambda v: 'NULL' if v is None else repr(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'"
WHY = "Wix description, Mom's or Dad's information (Alex, 2026-11-14)"
f0 = fill[0]
lines = [f"-- Alex, 2026-11-14 (docs/batch-2026-11-14-wix-parent-weights.md). Written by app/ops/wix_parent_weights.py, generated {T}.",
         "-- The mom and dad weights in the Wix product descriptions that the import missed. Each fills an empty weight only,",
         "-- and only where every puppy of the litter gives the same number. Every write is guarded, so a second run changes nothing.",
         f"UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, {q(T)}), generation = generation + 1",
         f"  WHERE id = 1 AND EXISTS (SELECT 1 FROM litters WHERE id = {q(f0['litter_id'])} AND {f0['col']} IS NULL);", '']
for f in fill:
    g = f"id = {q(f['litter_id'])} AND breeder_id = {q(f['breeder_id'])} AND {f['col']} IS NULL"
    lines += [f"-- {', '.join(f['puppies'])}",
              "INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)",
              f"  SELECT {q(T)}, 'system', 'claude', 'litter.update', 'litter', id, json_object('{f['col']}', NULL), "
              f"json_object('{f['col']}', {f['weight']!r}, 'why', {q(WHY)}) FROM litters WHERE {g};",
              f"UPDATE litters SET {f['col']} = {f['weight']!r}, updated_at = {q(T)}, version = version + 1 WHERE {g};"]
open(out_sql, 'w', encoding='utf8', newline='\n').write('\n'.join(lines) + '\n')
lits = {f['litter_id'] for f in fill}
print(f"fill {len(fill)} weights on {len(lits)} litters ({sum(1 for f in fill if f['col']=='mom_weight_lb')} mom, "
      f"{sum(1 for f in fill if f['col']=='dad_weight_lb')} dad; {len({f['litter_id'] for f in fill if f['public']})} litters with a public puppy); "
      f"differ {len(differ)}; skipped {len(skipped)}; litters with an unreadable weight {sum(1 for g in per.values() if g['unread'])}")
