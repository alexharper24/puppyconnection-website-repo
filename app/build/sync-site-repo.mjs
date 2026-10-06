// Copy the site build into a clone of the site repository (decision D10).
//
// The site repository, alexharper24/puppyconnection-site, holds the publish's data/*.json and
// everything that turns it into the deployed site. Everything except data/ is written from this
// repository by this script, so a change to the generator, the templates or the Worker is made
// and tested here, then sent across on purpose:
//
//   node app/build/sync-site-repo.mjs <path to a clone of puppyconnection-site> [--check]
//
// It never touches data/, which belongs to the database. It removes a file an earlier sync wrote
// that is no longer in the list, and nothing else. It writes SYNCED.json naming the commit here
// and a SHA-256 of each file, so the site repository says where its code came from. Review the
// diff in the clone, then commit and push it yourself. The push builds and deploys the site.
//
// --check changes nothing, prints what would change, and exits 1 when anything would.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const REPO = path.resolve(APP, '..');
const SITE_CHECKS = path.resolve(REPO, '../site-checks/check_site.py');

/** Every file the site repository gets, as [path there, path here]. */
export function fileList() {
  const list = [
    ['README.md', 'app/site/repo/README.md'],
    ['.gitignore', 'app/site/repo/.gitignore'],
    ['wrangler.jsonc', 'app/site/repo/wrangler.jsonc'],
    ['worker/site.js', 'app/site/static-worker.js'],
    ['lib/util.js', 'app/lib/util.js'],
    ['lib/stats.js', 'app/lib/stats.js'],
    ['lib/media.js', 'app/lib/media.js'],
    ['build/generate.mjs', 'app/build/generate.mjs'],
    ['build/ci-build.sh', 'app/build/ci-build.sh'],
    ['build/fetch-data.mjs', 'app/build/fetch-data.mjs'],
    ['templates/index.html', 'index.html'],
    ['templates/puppies.html', 'puppies.html'],
    ['templates/list-with-us.html', 'list-with-us.html'],
    ['templates/js/main.js', 'js/main.js'],
  ];
  const walk = (dir) => fs.readdirSync(path.join(REPO, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  for (const dir of ['css', 'img']) for (const f of walk(dir)) list.push([`templates/${f}`, f]);
  return list.map(([to, from]) => [to, path.join(REPO, from)]).concat([['build/check_site.py', SITE_CHECKS]]);
}

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
// Text files go across with LF endings, whatever this checkout has, so a sync from Windows and one
// from anywhere else write the same bytes.
const TEXT = /\.(md|js|mjs|jsonc?|sh|py|html|css|txt|svg)$|^\.gitignore$/;
function read(file) {
  const b = fs.readFileSync(file);
  return TEXT.test(path.basename(file)) ? Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n')) : b;
}

function appCommit() {
  try {
    const sha = execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD']).toString().trim();
    const dirty = execFileSync('git', ['-C', REPO, 'status', '--porcelain', '--', 'app/build', 'app/site', 'app/lib', 'index.html', 'puppies.html', 'list-with-us.html', 'css', 'img', 'js']).toString().trim();
    return { sha, uncommitted_changes: !!dirty };
  } catch { return { sha: null, uncommitted_changes: null }; }
}

export function sync(target, { check = false } = {}) {
  target = path.resolve(target);
  if (!fs.existsSync(path.join(target, '.git'))) throw new Error(`${target} is not a git clone. Clone alexharper24/puppyconnection-site first.`);
  const list = fileList();
  for (const [to, from] of list) {
    if (to.startsWith('data/')) throw new Error(`refusing to write ${to}, because data/ belongs to the database`);
    if (!fs.existsSync(from)) throw new Error(`${from} is missing`);
  }
  const manifestFile = path.join(target, 'SYNCED.json');
  const before = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { files: {} };
  const files = {};
  const changed = [], removed = [];
  for (const [to, from] of list) {
    const bytes = read(from);
    files[to] = sha256(bytes);
    const dest = path.join(target, to);
    if (fs.existsSync(dest) && sha256(fs.readFileSync(dest)) === files[to]) continue;
    changed.push(to);
    if (!check) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes); }
  }
  for (const old of Object.keys(before.files || {})) {
    if (files[old] || old.startsWith('data/')) continue;
    removed.push(old);
    if (!check) fs.rmSync(path.join(target, old), { force: true });
  }
  if (!check && (changed.length || removed.length || !fs.existsSync(manifestFile))) {
    const manifest = {
      about: 'Written by app/build/sync-site-repo.mjs in alexharper24/puppyconnection-website-repo. Every file listed here comes from that repository, so change it there.',
      app_commit: appCommit(), synced_at: new Date().toISOString().slice(0, 19) + 'Z', files,
    };
    fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return { target, files: list.length, changed, removed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!target) { console.error('usage: node app/build/sync-site-repo.mjs <clone of puppyconnection-site> [--check]'); process.exit(2); }
  const check = process.argv.includes('--check');
  try {
    const r = sync(target, { check });
    console.log(`${check ? 'would change' : 'changed'} ${r.changed.length} of ${r.files} files${r.removed.length ? `, ${check ? 'would remove' : 'removed'} ${r.removed.length}` : ''}`);
    for (const f of r.changed) console.log(`  ${f}`);
    for (const f of r.removed) console.log(`  removed ${f}`);
    if (!check) console.log(`\nReview with: git -C "${r.target}" status, then commit and push.`);
    process.exit(check && (r.changed.length || r.removed.length) ? 1 : 0);
  } catch (e) { console.error(`sync-site-repo: ${e.message}`); process.exit(1); }
}
