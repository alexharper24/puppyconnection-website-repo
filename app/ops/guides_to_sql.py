# Turns the researched breed guide drafts into a migration that sets breeds.guide.
#
# The database owns the guide text (Amber edits it in the admin's Breeds screen), so a rewrite
# goes in as SQL rather than into any file the site is built from. Each draft is Markdown with a
# YAML header. The header is dropped, wrapped lines are joined into paragraphs, and a "## "
# heading stays as its own paragraph, which the generator shows as a section heading. The
# {{count}}, {{price_range}}, {{deposit_range}}, {{includes}} and {{parent_weights}} tokens stay
# as written and are filled from the listings on every publish.
#
#   python app/ops/guides_to_sql.py <drafts folder> <out.sql>
#
# Sentences that point at guide pages not yet built are removed, and so are the stand-alone
# guides (files starting "guide-"), which become their own pages later.
import os, re, sys
from datetime import datetime, timezone

DROP = [r"Our Bernedoodle sizes guide[^.]*\."]


def body(path):
    text = open(path, encoding="utf-8").read().replace("\r\n", "\n")
    if text.startswith("---"):
        text = text.split("\n---", 1)[1].split("\n", 1)[1]
    for pat in DROP:
        text = re.sub(pat, "", text)
    paras = []
    for block in re.split(r"\n\s*\n", text):
        line = " ".join(l.strip() for l in block.strip().split("\n") if l.strip())
        if line:
            paras.append(line)
    return "\n\n".join(paras)


def main():
    src, out = sys.argv[1], sys.argv[2]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    rows = []
    for f in sorted(os.listdir(src)):
        if not f.endswith(".md") or f.startswith("guide-"):
            continue
        slug = f[:-3]
        g = body(os.path.join(src, f)).replace("'", "''")
        rows.append(f"UPDATE breeds SET guide = '{g}', guide_updated_at = '{now}' WHERE slug = '{slug}';")
    head = ("-- 2026-10-10. Researched breed guides with section headings, replacing the text restored\n"
            "-- from the Wix breed pages. Written by app/ops/guides_to_sql.py from the 2026-09-28 drafts,\n"
            "-- whose facts are sourced to AKC, the national breed clubs and the published research.\n"
            "-- Drafts for Alex's review: Amber can edit any of them afterwards in the admin's Breeds screen.\n"
            "-- French Bulldog, Labrador Retriever and Papillon have no draft yet and keep their text.\n")
    open(out, "w", encoding="utf-8", newline="\n").write(head + "\n".join(rows) + "\n")
    print(f"{len(rows)} guides written to {out}")


if __name__ == "__main__":
    main()
