// A stand-in for the parts of GitHub's Git Data API the publish uses (lib/github.js), so the
// publish is tested end to end with no token and no real repository. It keeps blobs, trees,
// commits and branches in memory, computes blob SHAs the way git does (so the publish's own
// SHAs must agree with it for unchanged files to drop out), refuses a request without the
// test token or a User-Agent as GitHub does, and refuses a branch move that is not a fast
// forward.
//
//   node app/dev/github-standin.mjs [--port 8798]
//
// Control routes for the tests, all outside /repos:
//   GET  /_state                 branches, commit count, the last commit and the files it changed
//   GET  /_files?prefix=site/    every file at the branch tip under prefix, base64
//   POST /_fail {method, path, status, times}   fail matching requests (path is a regex)
//   POST /_race                  the next branch move finds the branch moved by someone else
//   POST /_reset                 an empty repository again

import http from 'node:http';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const TOKEN = 'local-test-token';
export const REPO = 'local/puppyconnection-site';

const sha1 = (b) => createHash('sha1').update(b).digest('hex');
const blobSha = (bytes) => sha1(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]));

export function createStandin() {
  let st;
  const reset = () => {
    st = { blobs: new Map(), trees: new Map(), commits: new Map(), refs: new Map(), log: [], fail: [], race: false, n: 0 };
    // The repository starts with one commit holding a README, as a real one would.
    const readme = Buffer.from('Puppy Connection site\n');
    const b = blobSha(readme); st.blobs.set(b, readme);
    const tree = new Map([['README.md', b]]);
    const t = treeSha(tree); st.trees.set(t, tree);
    const c = commitSha({ tree: t, parents: [], message: 'Start' }); st.commits.set(c, { tree: t, parents: [], message: 'Start' });
    st.refs.set('main', c);
  };
  const treeSha = (m) => sha1(JSON.stringify([...m.entries()].sort()));
  const commitSha = (c) => sha1(JSON.stringify(c) + (st.n += 1));
  reset();

  const send = (res, status, body) => { res.statusCode = status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)); };

  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    let raw = ''; for await (const c of req) raw += c;
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === '/_reset') { reset(); return send(res, 200, { ok: true }); }
    if (url.pathname === '/_fail') { st.fail.push({ times: 1, ...body, rx: new RegExp(body.path) }); return send(res, 200, { ok: true }); }
    if (url.pathname === '/_race') { st.race = true; return send(res, 200, { ok: true }); }
    if (url.pathname === '/_state') {
      const tip = st.refs.get('main'); const c = st.commits.get(tip);
      const parent = c.parents[0] ? st.trees.get(st.commits.get(c.parents[0]).tree) : new Map();
      const now = st.trees.get(c.tree);
      const changed = [...now.entries()].filter(([p, s]) => parent.get(p) !== s).map(([p]) => p).sort();
      return send(res, 200, { branch: 'main', tip, commits: st.commits.size, message: c.message, changed, files: now.size, requests: st.log.length, log: st.log.slice(-40) });
    }
    if (url.pathname === '/_files') {
      const prefix = url.searchParams.get('prefix') || '';
      const tree = st.trees.get(st.commits.get(st.refs.get('main')).tree);
      const out = {};
      for (const [p, s] of tree) if (p.startsWith(prefix)) out[p] = st.blobs.get(s).toString('base64');
      return send(res, 200, out);
    }

    st.log.push(`${req.method} ${url.pathname}`);
    if (!req.headers['user-agent']) return send(res, 403, { message: 'Request forbidden by administrative rules. Please make sure your request has a User-Agent header.' });
    if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { message: 'Bad credentials' });
    const f = st.fail.find((x) => x.times > 0 && (!x.method || x.method === req.method) && x.rx.test(url.pathname));
    if (f) { f.times -= 1; return send(res, f.status || 500, { message: 'Stand-in failure for the test' }); }

    const m = url.pathname.match(/^\/repos\/([\w.-]+\/[\w.-]+)(\/git\/.*)$/);
    if (!m || m[1] !== REPO) return send(res, 404, { message: 'Not Found' });
    const p = m[2];
    let x;
    if (req.method === 'GET' && (x = p.match(/^\/git\/ref\/heads\/(.+)$/))) {
      const sha = st.refs.get(x[1]);
      return sha ? send(res, 200, { ref: `refs/heads/${x[1]}`, object: { sha, type: 'commit' } }) : send(res, 404, { message: 'Not Found' });
    }
    if (req.method === 'GET' && (x = p.match(/^\/git\/commits\/(\w+)$/))) {
      const c = st.commits.get(x[1]);
      return c ? send(res, 200, { sha: x[1], tree: { sha: c.tree }, parents: c.parents.map((s) => ({ sha: s })), message: c.message }) : send(res, 404, { message: 'Not Found' });
    }
    if (req.method === 'GET' && (x = p.match(/^\/git\/trees\/(\w+)$/))) {
      const t = st.trees.get(x[1]);
      if (!t) return send(res, 404, { message: 'Not Found' });
      return send(res, 200, { sha: x[1], truncated: false, tree: [...t.entries()].map(([path, sha]) => ({ path, mode: '100644', type: 'blob', sha })) });
    }
    if (req.method === 'POST' && p === '/git/blobs') {
      const bytes = body.encoding === 'base64' ? Buffer.from(body.content, 'base64') : Buffer.from(body.content, 'utf8');
      const sha = blobSha(bytes); st.blobs.set(sha, bytes);
      return send(res, 201, { sha });
    }
    if (req.method === 'POST' && p === '/git/trees') {
      const base = body.base_tree ? st.trees.get(body.base_tree) : new Map();
      if (!base) return send(res, 422, { message: 'base_tree not found' });
      const t = new Map(base);
      for (const e of body.tree) {
        if (!st.blobs.has(e.sha)) return send(res, 422, { message: `blob ${e.sha} not found` });
        t.set(e.path, e.sha);
      }
      const sha = treeSha(t); st.trees.set(sha, t);
      return send(res, 201, { sha });
    }
    if (req.method === 'POST' && p === '/git/commits') {
      if (!st.trees.has(body.tree)) return send(res, 422, { message: 'tree not found' });
      const c = { tree: body.tree, parents: body.parents || [], message: body.message };
      const sha = commitSha(c); st.commits.set(sha, c);
      return send(res, 201, { sha });
    }
    if (req.method === 'PATCH' && (x = p.match(/^\/git\/refs\/heads\/(.+)$/))) {
      if (st.race) {
        // Someone else pushed first: the branch gains a commit the publish has not seen.
        st.race = false;
        const cur = st.refs.get(x[1]); const c = { tree: st.commits.get(cur).tree, parents: [cur], message: 'Someone else' };
        const sha = commitSha(c); st.commits.set(sha, c); st.refs.set(x[1], sha);
      }
      const c = st.commits.get(body.sha);
      if (!c) return send(res, 422, { message: 'Object does not exist' });
      if (!body.force && c.parents[0] !== st.refs.get(x[1])) return send(res, 422, { message: 'Update is not a fast forward' });
      st.refs.set(x[1], body.sha);
      return send(res, 200, { ref: `refs/heads/${x[1]}`, object: { sha: body.sha } });
    }
    return send(res, 404, { message: 'Not Found' });
  }

  const server = http.createServer((req, res) => handle(req, res).catch((e) => send(res, 500, { message: String(e) })));
  return { server, state: () => st };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--port');
  const port = i > 0 ? Number(process.argv[i + 1]) : 8798;
  createStandin().server.listen(port, () => console.log(`stand-in GitHub on http://localhost:${port}`));
}
