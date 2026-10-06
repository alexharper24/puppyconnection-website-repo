#!/usr/bin/env bash
# The site build (spec section 9, decisions D10 and D11). Cloudflare Workers Builds runs this in
# the site repository, alexharper24/puppyconnection-site, whenever the portal calls the site's
# deploy hook (a publish) and on every push to main (a code change), and then runs
# `npx wrangler deploy`. This file is the source of build/ci-build.sh there, copied by
# app/build/sync-site-repo.mjs, so it is written for that repository's layout.
#
# THIS IS THE STEP THAT TURNS A PUBLISH INTO PAGES. Without it the deploy ships no pages, and a
# breeder's change never reaches the site, which is the Teapup lesson of 2026-09-12.
#
#   Build command in Workers Builds:   bash build/ci-build.sh
#   Deploy command:                     npx wrangler deploy
#   Locally, from the site repository: bash build/ci-build.sh   (add --deploy to deploy too)
#
# Where the data comes from. In hook mode, the default, nothing commits data here, so the build
# fetches it from DATA_URL, the portal's /data/export.json, which is read from the database's
# public views. In commit mode the publish commits data/*.json here, and when all four files are
# in the checkout the build uses them and fetches nothing.
#
# It builds the pages into a folder outside the checkout, checks them with check_site.py, and
# only then copies them into dist/, which wrangler.jsonc names as the assets folder. Anything
# that fails stops the build, so the site already deployed stays as it was. The pages are built
# outside the checkout because check_site.py treats any file in a checkout that git does not track
# as an image nobody committed.
#
# Settings, all optional, set as build variables in Workers Builds:
#   DATA_URL        default https://portal.puppyconnection.workers.dev/data/export.json
#   SITE_URL        the address pages name as canonical, default https://site.puppyconnection.workers.dev/
#   PORTAL_ORIGIN   where the footer's privacy and terms links go, default the staging portal
#   SITE_INDEXABLE  1 at launch, to drop noindex (docs/launch-checklist.md in the app repository)
#   SITE_CHECKS_URL where to fetch check_site.py, default the public alexharper24/site-checks.
#                   When it cannot be fetched, the copy in build/check_site.py is used.
#   PYTHON          the Python to run it with, default python3, then python

set -euo pipefail
cd "$(dirname "$0")/.."

WORK="${TMPDIR:-/tmp}/pc-site-build"
OUT="$WORK/pages"
CHECKER="$WORK/check_site.py"
DATA_URL="${DATA_URL:-https://portal.puppyconnection.workers.dev/data/export.json}"
SITE_CHECKS_URL="${SITE_CHECKS_URL:-https://raw.githubusercontent.com/alexharper24/site-checks/main/check_site.py}"

echo "=== node"
node --version

rm -rf "$WORK"
mkdir -p "$WORK"

echo "=== data"
committed=1
for f in breeds breeders litters puppies; do [ -f "data/$f.json" ] || committed=0; done
if [ "$committed" = "1" ]; then
  echo "using the data/*.json committed here (commit mode)"
  DATA_DIR="."
else
  echo "fetching $DATA_URL"
  node build/fetch-data.mjs "$DATA_URL" "$WORK/data-src"
  DATA_DIR="$WORK/data-src"
fi

echo "=== pages"
args=(--data "$DATA_DIR" --templates templates --out "$OUT")
[ -n "${SITE_URL:-}" ] && args+=(--base "$SITE_URL")
[ -n "${PORTAL_ORIGIN:-}" ] && args+=(--portal "$PORTAL_ORIGIN")
[ "${SITE_INDEXABLE:-}" = "1" ] && args+=(--indexable)
node build/generate.mjs "${args[@]}"

echo "=== site-checks"
if command -v curl >/dev/null 2>&1 && curl -fsSL --max-time 30 "$SITE_CHECKS_URL" -o "$CHECKER"; then
  echo "using check_site.py from $SITE_CHECKS_URL"
else
  cp build/check_site.py "$CHECKER"
  echo "using the copy in build/check_site.py"
fi
PY="${PYTHON:-}"
if [ -z "$PY" ]; then
  # Run each one rather than only finding it, because Windows has a python3 that only opens the Store.
  if python3 -c '' >/dev/null 2>&1; then PY=python3; else PY=python; fi
fi
"$PY" --version
PYTHONIOENCODING=utf-8 "$PY" "$CHECKER" "$OUT"

echo "=== dist"
rm -rf dist
mkdir -p dist
cp -R "$OUT"/. dist/
# The checker's settings are for the check only, so they are not served.
rm -f dist/.sitecheck.json
echo "$(find dist -name '*.html' | wc -l | tr -d ' ') pages in dist"

if [ "${1:-}" = "--deploy" ]; then
  echo "=== deploy"
  npx wrangler deploy
fi

echo "=== done"
