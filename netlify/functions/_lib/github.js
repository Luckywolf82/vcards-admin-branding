// _lib/github.js
// Bruker GitHub Contents API for å opprette/oppdatere/slette filer.
// Forutsetter env: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, (valgfritt) GITHUB_BRANCH

function parseRepoEnv(value) {
  if (!value) return {};
  const trimmed = String(value).trim();
  if (!trimmed) return {};
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const parts = url.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
      if (parts.length >= 2) {
        const [owner, repoRaw] = parts;
        const repo = repoRaw.replace(/\.git$/, '');
        return { owner, repo };
      }
    }
  } catch (_) {
    // ignore parsing errors
  }

  if (trimmed.includes('/')) {
    const [owner, repoRaw] = trimmed.split('/');
    if (owner && repoRaw) {
      return { owner: owner.trim(), repo: repoRaw.replace(/\.git$/, '').trim() };
    }
  }

  return {};
}

const parsedRepo = parseRepoEnv(process.env.GITHUB_REPOSITORY || process.env.REPOSITORY_URL);

function cleanBranch(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  return trimmed.replace(/^refs\/heads\//i, '');
}

function looksLikeSha(value = '') {
  return /^[0-9a-f]{40}$/i.test(String(value).trim());
}

function resolveBranch() {
  const candidates = [
    process.env.GITHUB_BRANCH,
    process.env.BRANCH,
    process.env.GITHUB_REF_NAME,
    process.env.GITHUB_REF,
    process.env.HEAD,
    process.env.GIT_BRANCH
  ];

  for (const candidate of candidates) {
    const cleaned = cleanBranch(candidate);
    if (!cleaned) continue;
    if (looksLikeSha(cleaned)) continue;
    return cleaned;
  }

  return 'main';
}

const OWNER  = process.env.GITHUB_OWNER || parsedRepo.owner;
const REPO   = process.env.GITHUB_REPO  || parsedRepo.repo;
const BRANCH = resolveBranch();
const TOKEN  = (process.env.GITHUB_TOKEN || process.env.GIT_TOKEN || '').trim();
const API    = 'https://api.github.com';
const USER_AGENT = 'nfcking-admin-bot/1.0';

class GitHubConfigError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = 'GitHubConfigError';
    this.missing = missing;
  }
}

function ensureConfig({ requireToken = true } = {}) {
  const missing = [];
  if (!OWNER) missing.push('GITHUB_OWNER');
  if (!REPO) missing.push('GITHUB_REPO');
  if (requireToken && !TOKEN) missing.push('GITHUB_TOKEN');
  if (missing.length) {
    throw new GitHubConfigError(`Missing GitHub configuration: ${missing.join(', ')}`, missing);
  }
}

function getHeaders(extra = {}, { requireToken = true } = {}) {
  ensureConfig({ requireToken });
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
    ...extra,
  };
  if (TOKEN) {
    headers.Authorization = `token ${TOKEN}`;
  }
  return headers;
}

function encodePath(path) {
  return String(path)
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

async function ghFetch(path, init = {}, options = {}) {
  const headers = getHeaders(init.headers, options);
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
    const data = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${encodeURIComponent(BRANCH)}`, {}, { requireToken: Boolean(TOKEN) });
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
  ensureConfig({ requireToken: true });
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
    const data = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${encodeURIComponent(BRANCH)}`, {}, { requireToken: Boolean(TOKEN) });
    if (!data || !data.content) return null;
    const buff = Buffer.from(data.content, data.encoding || 'base64');
    return buff.toString('utf8');
  } catch (err) {
    if (/GitHub 404/.test(err.message)) return null;
    throw err;
  }
}

async function getRepoTree() {
  const tree = await ghFetch(`/repos/${OWNER}/${REPO}/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`, {}, { requireToken: Boolean(TOKEN) });
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
  encodePath,
  GitHubConfigError,
  ensureConfig
};
