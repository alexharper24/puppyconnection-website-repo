# Puppy Connection site

The code that builds and serves the public Puppy Connection directory. Cloudflare Workers Builds
runs it for the `site` Worker in the Puppy Connection account. This repository is private until
launch (decision D10).

Nothing here holds the directory's data. Each build fetches the public data from the portal at
`https://portal.puppyconnection.workers.dev/data/export.json`, which reads the database's public
views only, then builds every page and deploys them with the site Worker.

Do not edit anything here by hand. Everything is copied from
[puppyconnection-website-repo](https://github.com/alexharper24/puppyconnection-website-repo) by
`app/build/sync-site-repo.mjs`, and the next sync replaces it.

## How a change reaches the site

1. A breeder or an operator changes something, and the database marks the site as changed.
2. The portal calls this Worker's Workers Builds deploy hook, from its 15-minute schedule or at
   once from the admin's Publish now (`app/lib/publish.js`, hook mode). One period of changes
   starts one build.
3. Workers Builds runs `bash build/ci-build.sh`, which fetches the data, builds the pages and
   checks them with site-checks, then `npx wrangler deploy`. A failed fetch or check stops the
   build, and the site already deployed stays as it was.

A push to `main` also builds and deploys, which is how a change to the code goes out.

No photo is stored here (decision D11). Every photo uploaded by a breeder or brought in by the Wix
import lives in R2, and the Worker serves it at `/media/<photo id>` and `/media/<photo id>/card`
while its puppy is public. A Wix photo not imported yet keeps its Wix address.

## What is here

| Path | What it is | Copied from, in the app repository |
|---|---|---|
| `build/ci-build.sh` | Fetches the data, builds the pages, checks them, copies them into `dist/` | `app/build/` |
| `build/fetch-data.mjs` | Fetches `/data/export.json` and writes `data/*.json` for the generator | `app/build/` |
| `build/generate.mjs` | Builds every page from the data and `templates/`, Node with no packages | `app/build/` |
| `build/check_site.py` | A copy of site-checks, used when the public one cannot be fetched | `../site-checks` |
| `templates/` | The concept site's pages, stylesheet, images and `js/main.js` | The repository root |
| `worker/site.js` | The site Worker: the home page, `/media`, `/brand` and `/api/beacon` | `app/site/static-worker.js` |
| `lib/` | The three small modules the Worker uses | `app/lib/` |
| `wrangler.jsonc` | The Worker, its assets folder `dist/`, the database and the file store | `app/site/repo/` |
| `SYNCED.json` | The app commit the last sync came from, and a hash of each file | The sync |

If `data/*.json` is ever committed here (the publish's commit mode, kept for later), the build
uses those files and fetches nothing.

## Workers Builds settings

| Setting | Value |
|---|---|
| Worker | `site` in the Puppy Connection account |
| Repository and branch | `alexharper24/puppyconnection-site`, `main` |
| Root directory | `/` |
| Build command | `bash build/ci-build.sh` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch builds | Off |
| Build variables | None for staging. `DATA_URL`, `SITE_URL`, `PORTAL_ORIGIN` and `SITE_INDEXABLE` exist for a move to other hostnames |
| Deploy hook | One, on `main`. Its address is the portal's `PUBLISH_HOOK_URL` secret |

## Building it locally

```bash
bash build/ci-build.sh                                                  # pages into dist/, checked
DATA_URL=http://localhost:8787/data/export.json bash build/ci-build.sh  # from a local portal
```

Needs Node 22 or later and Python 3. Never run `wrangler deploy` from a laptop, because the
Worker is named `site` and that replaces whatever Workers Builds deployed.

## Changing the generator, the templates or the Worker

Change them in the app repository, run its `app/dev/publish-test.mjs`, then from `C:\Git_Repos`:

```bash
node puppyconnection-website-repo/app/build/sync-site-repo.mjs <path to a clone of this repository>
```

Review the diff in the clone, commit and push. The push builds and deploys the site.
