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

const BRANCH_HINTS = [
  process.env.GITHUB_DEFAULT_BRANCH,
  process.env.REPOSITORY_BRANCH,
  process.env.DEFAULT_BRANCH,
  process.env.NETLIFY_DEFAULT_BRANCH,
  'main',
  'master'
];

function branchCandidates(...preferred) {
  return Array.from(new Set([
    ...preferred,
    BRANCH,
    ...BRANCH_HINTS
  ].filter(Boolean)));
}

function shouldRetryBranch(err) {
  if (!err || typeof err.message !== 'string') return false;
  return /GitHub\s+(404|422)/.test(err.message);
}

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

async function getFileSha(filepath, branch = BRANCH) {
  try {
    const encoded = encodePath(filepath);
    const data = await ghFetch(
      `/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${encodeURIComponent(branch)}`,
      {},
      { requireToken: Boolean(TOKEN) }
    );
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
  const encoded = encodePath(path);
  const content64 = Buffer.from(content, 'utf8').toString('base64');
  const branches = branchCandidates();
  let lastError = null;

  for (const branch of branches) {
    try {
      const sha = await getFileSha(path, branch);
      const body = {
        message: message || `chore(publish): ${path}`,
        content: content64,
        branch,
        ...(sha ? { sha } : {})
      };
      const resp = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return resp;
    } catch (err) {
      if (!shouldRetryBranch(err)) {
        throw err;
      }
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  throw new Error('GitHub branch lookup failed');
}

async function deleteFile({ path, message }) {
  const encoded = encodePath(path);
  const branches = branchCandidates();
  let lastError = null;

  for (const branch of branches) {
    try {
      const sha = await getFileSha(path, branch);
      if (!sha) continue;
      const body = { message: message || `chore(delete): ${path}`, sha, branch };
      const resp = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${encoded}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return resp;
    } catch (err) {
      if (!shouldRetryBranch(err)) {
        throw err;
      }
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  return { skipped: true };
}

async function readFile(path, { branches } = {}) {
  const encoded = encodePath(path);
  const preferred = (branches === undefined || branches === null)
    ? []
    : (Array.isArray(branches) ? branches : [branches]);
  const branchList = preferred.length ? branchCandidates(...preferred) : branchCandidates();

  for (const branch of branchList) {
    try {
      const data = await ghFetch(
        `/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${encodeURIComponent(branch)}`,
        {},
        { requireToken: Boolean(TOKEN) }
      );
      if (!data || !data.content) continue;
      const buff = Buffer.from(data.content, data.encoding || 'base64');
      return buff.toString('utf8');
    } catch (err) {
      if (shouldRetryBranch(err)) {
        continue;
      }
      if (/GitHub 404/.test(err.message)) continue;
      throw err;
    }
  }

  return null;
}

async function getRepoTree(branchOverride) {
  const branchList = branchOverride
    ? branchCandidates(branchOverride)
    : branchCandidates();

  for (const branch of branchList) {
    try {
      const tree = await ghFetch(
        `/repos/${OWNER}/${REPO}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
        {},
        { requireToken: Boolean(TOKEN) }
      );
      return Array.isArray(tree.tree) ? tree.tree : [];
    } catch (err) {
      if (!shouldRetryBranch(err)) {
        throw err;
      }
    }
  }

  return [];
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
