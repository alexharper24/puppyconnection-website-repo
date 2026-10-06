// The GitHub Git Data API, for the publish commit (spec section 9, plan P4.3). This is the
// Teapup publish pipeline (breeder-site-backend publish-pipeline.md): blob SHAs computed here so
// an unchanged file drops out without a request, base64 in 32 KB chunks so a large photo cannot
// blow the stack, a User-Agent because GitHub refuses requests without one, and everything in ONE
// commit, with the branch moved without force so a publish racing another cannot overwrite it.
//
// Settings
//   GITHUB_TOKEN   secret. A fine-grained token with Contents read and write on the site repo
//                  only (plan F4). Without it nothing here is called.
//   GITHUB_REPO    owner/name of the repository the site is published to.
//   GITHUB_BRANCH  the branch, main unless set.
//   GITHUB_API     only for the local test, which runs a stand-in GitHub (dev/github-standin.mjs).
//                  Honored only while DEV_MODE is local, so a deployed Worker always talks to GitHub.

const API = 'https://api.github.com';

export function githubApi(env) {
  return env.DEV_MODE === 'local' && env.GITHUB_API ? env.GITHUB_API.replace(/\/$/, '') : API;
}

/** What is missing before a publish can reach GitHub, or null when nothing is. */
export function githubMissing(env) {
  if (!env.GITHUB_TOKEN) return 'GITHUB_TOKEN is not set, so the site is not published to GitHub. Alex adds the repository token (plan F4).';
  if (!env.GITHUB_REPO || !/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPO)) return 'GITHUB_REPO is not set to owner/name, so there is nowhere to publish the site.';
  return null;
}

function headers(env) {
  return {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'puppyconnection-publish',
    'content-type': 'application/json',
  };
}

export async function gh(env, path, init = {}) {
  const res = await fetch(`${githubApi(env)}/repos/${env.GITHUB_REPO}${path}`, { ...init, headers: headers(env) });
  if (!res.ok) {
    const body = await res.text();
    // The token never appears in a message, and the body is cut short before it is stored.
    throw new Error(`GitHub ${init.method || 'GET'} ${path} answered ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** base64 for a binary body, 32 KB at a time. */
export function toBase64(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u.length; i += CHUNK) binary += String.fromCharCode.apply(null, u.subarray(i, i + CHUNK));
  return btoa(binary);
}

/** The SHA git gives this content: SHA-1 of "blob <length>\0" followed by the bytes. */
export async function gitBlobSha(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const header = new TextEncoder().encode(`blob ${u.byteLength}\0`);
  const joined = new Uint8Array(header.length + u.byteLength);
  joined.set(header, 0);
  joined.set(u, header.length);
  const digest = await crypto.subtle.digest('SHA-1', joined);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The branch tip, its tree, and every blob path in it under prefix (or all paths). */
export async function branchTree(env, prefix = '') {
  const branch = env.GITHUB_BRANCH || 'main';
  const head = await gh(env, `/git/ref/heads/${branch}`);
  const parent = head.object.sha;
  const commit = await gh(env, `/git/commits/${parent}`);
  const tree = await gh(env, `/git/trees/${commit.tree.sha}?recursive=1`);
  if (tree.truncated) throw new Error('The repository listing came back truncated, so what changed cannot be known. Nothing was published.');
  const paths = new Map();
  for (const e of tree.tree || []) if (e.type === 'blob' && e.path.startsWith(prefix)) paths.set(e.path, e.sha);
  return { branch, parent, treeSha: commit.tree.sha, paths };
}

/**
 * Write changed files as one commit on the branch read by branchTree. Each change is
 * { path, bytes, binary }. Text goes up as UTF-8 and binary as base64. Returns the commit SHA.
 */
export async function commitChanges(env, base, changes, message) {
  const tree = [];
  for (const c of changes) {
    const blob = await gh(env, '/git/blobs', {
      method: 'POST',
      body: JSON.stringify(c.binary
        ? { content: toBase64(c.bytes), encoding: 'base64' }
        : { content: new TextDecoder().decode(c.bytes), encoding: 'utf-8' }),
    });
    tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  // base_tree makes this a patch of the branch, so every file not named here stays as it is.
  const newTree = await gh(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.treeSha, tree }) });
  const commit = await gh(env, '/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [base.parent] }) });
  await gh(env, `/git/refs/heads/${base.branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
  return commit.sha;
}
