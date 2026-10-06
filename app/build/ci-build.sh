#!/usr/bin/env bash
# The site build that runs after every publish (spec section 9, plan P4.3).
#
# The publish commits only data/*.json and new photos under PUBLISH_DIR (default "site"). This
# script turns them into the public pages, refuses to go on if site-checks finds an error, and
# leaves the pages in OUT for the deploy step. Without it a publish reaches GitHub and stops there,
# which is the Teapup lesson of 2026-09-12.
#
#   bash app/build/ci-build.sh
#
# Settings, all optional:
#   PUBLISH_DIR     the folder the publish writes to, default site
#   OUT             where the pages go, default $RUNNER_TEMP/pc-site or /tmp/pc-site. Keep it
#                   outside the git checkout, because check_site.py treats any file in a checkout
#                   that git does not track as an image nobody committed.
#   SITE_URL        the address pages name as canonical, default https://site.puppyconnection.workers.dev/
#   PORTAL_ORIGIN   where the footer's privacy and terms links go
#   SITE_INDEXABLE  1 at launch, to drop noindex (docs/launch-checklist.md)
#   SITE_CHECKS     a checkout of github.com/alexharper24/site-checks, default ../site-checks
#   PYTHON          the Python to run it with, default python3
#
# The deploy itself (wrangler deploy of the site Worker over OUT) needs a Cloudflare API token in
# the CI secrets, which is Alex's to create, so it is not in this script yet.

set -euo pipefail
cd "$(dirname "$0")/../.."

PUBLISH_DIR="${PUBLISH_DIR:-site}"
OUT="${OUT:-${RUNNER_TEMP:-/tmp}/pc-site}"
SITE_CHECKS="${SITE_CHECKS:-../site-checks}"

echo "=== node"
node --version

echo "=== pages"
args=(--data "$PUBLISH_DIR" --out "$OUT")
[ -n "${SITE_URL:-}" ] && args+=(--base "$SITE_URL")
[ -n "${PORTAL_ORIGIN:-}" ] && args+=(--portal "$PORTAL_ORIGIN")
[ "${SITE_INDEXABLE:-}" = "1" ] && args+=(--indexable)
node app/build/generate.mjs "${args[@]}"

echo "=== site-checks"
"${PYTHON:-python3}" "$SITE_CHECKS/check_site.py" "$OUT"

echo "=== done, pages in $OUT"
