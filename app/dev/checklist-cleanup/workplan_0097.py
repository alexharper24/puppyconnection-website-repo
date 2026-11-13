"""Bring launch-workplan.md into step with checklist migration 0097 (Alex, 2026-11-12)."""
import re
from pathlib import Path

p = Path(__file__).resolve().parents[2] / 'docs' / 'launch-workplan.md'
s = p.read_text(encoding='utf-8')
CLOSED = ['A5', 'A18', 'A25', 'A26', 'B8', 'B9', 'B3', 'B5', 'F1', 'F4', 'F5']
MOVED = ['A31', 'E4', 'F6']
for i in CLOSED + MOVED:
    rx = re.compile(r'^(\s*- \{id: ' + i + r', status: )("[^"]*"|[\w-]+)', re.M)
    assert len(rx.findall(s)) == 1, i
    new = 'closed, closed_by: "Alex 2026-11-12, checklist cleanup 0097"' if i in CLOSED else '"moved to monthly care (Alex 2026-11-12, checklist 0097 archived it)"'
    s = rx.sub(lambda m: m.group(1) + new, s)
# Puppy video is now an open Gate 1 item with no area.
rx = re.compile(r'^(\s*- \{id: A23, status: open), area: after-launch', re.M)
assert len(rx.findall(s)) == 1
s = rx.sub(r'\1, moved_to_gate1: "Alex 2026-11-12, an a la carte menu item at $100 (checklist 0097)"', s)
p.write_text(s, encoding='utf-8', newline='\n')
print('ok')
