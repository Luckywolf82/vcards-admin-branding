// _lib/github.js
// Bruker GitHub Contents API for å opprette/oppdatere/slette filer.
// Forutsetter env: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, (valgfritt) GITHUB_BRANCH

const OWNER  = process.env.GITHUB_OWNER;
const REPO   = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const API    = 'https://api.github.com';

function encodePath(path) {
  return String(path)
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

async function ghFetch(path, init = {}) {
  const headers = {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    ...init.headers
  };
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`GitHub ${res.status}: ${text}`);
  }
  return res.json();
}

async function getFileSha(filepath) {
  try {
    const encoded = encodePath(filepath);
    const data = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${encodeURIComponent(BRANCH)}`);
    return data.sha || null;
  } catch (e) {
    // 404 → fil finnes ikke
    return null;
  }
}

/**
 * commitFile({ path, content, message })
 * content må være UTF-8 string; base64-encodes her.
 */
async function commitFile({ path, content, message }) {
  const sha = await getFileSha(path);
  const body = {
    message: message || `chore(publish): ${path}`,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: BRANCH,
    ...(sha ? { sha } : {})
  };
  const encoded = encodePath(path);
  const resp = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return resp;
}

async function deleteFile({ path, message }) {
  const sha = await getFileSha(path);
  if (!sha) return { skipped: true };
  const body = { message: message || `chore(delete): ${path}`, sha, branch: BRANCH };
  const encoded = encodePath(path);
  const resp = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return resp;
}

async function readFile(path) {
  try {
    const encoded = encodePath(path);
    const data = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${encodeURIComponent(BRANCH)}`);
    if (!data || !data.content) return null;
    const buff = Buffer.from(data.content, data.encoding || 'base64');
    return buff.toString('utf8');
  } catch (err) {
    if (/GitHub 404/.test(err.message)) return null;
    throw err;
  }
}

async function getRepoTree() {
  const tree = await ghFetch(`/repos/${OWNER}/${REPO}/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`);
  return Array.isArray(tree.tree) ? tree.tree : [];
}

module.exports = {
  commitFile,
  deleteFile,
  getFileSha,
  readFile,
  getRepoTree,
  OWNER,
  REPO,
  BRANCH,
  encodePath
};
