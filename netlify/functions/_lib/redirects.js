const { commitFile, readFile, GitHubConfigError } = require('./github');
const { normalizeSlug } = require('./pages');

const REDIRECTS_FILE = '_redirects';

function shouldHandleSlug(slug = '') {
  const clean = normalizeSlug(slug);
  if (!clean) return false;
  if (clean === 'index') return false;
  if (clean.endsWith('.html')) return false;
  if (clean.includes('/')) return false;
  return true;
}

function parseLines(content = '') {
  if (!content) return [];
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildLine(from, to, status = '301') {
  return `${from} ${to} ${status}`.trim();
}

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeLine(lines, fromPath) {
  const pattern = new RegExp(`^${escapeForRegex(fromPath)}\s`);
  return lines.filter((line) => !pattern.test(line));
}

async function readRedirects() {
  try {
    const file = await readFile(REDIRECTS_FILE);
    return typeof file === 'string' ? file : '';
  } catch (err) {
    if (err instanceof GitHubConfigError) throw err;
    return '';
  }
}

async function writeRedirects(lines, message) {
  const body = `${lines.join('\n')}${lines.length ? '\n' : ''}`;
  await commitFile({
    path: REDIRECTS_FILE,
    content: body,
    message: message || 'update redirects'
  });
}

async function ensureCleanUrlRedirect(slug) {
  if (!shouldHandleSlug(slug)) return null;
  const clean = normalizeSlug(slug);
  const from = `/${clean}`;
  const to = `/${clean}/`;

  const existing = parseLines(await readRedirects());
  const filtered = removeLine(existing, from);
  filtered.push(buildLine(from, to, '301'));

  await writeRedirects(filtered, `redirect: ${clean}`);
  return { from, to };
}

async function removeCleanUrlRedirect(slug) {
  if (!shouldHandleSlug(slug)) return null;
  const clean = normalizeSlug(slug);
  const from = `/${clean}`;

  const existing = parseLines(await readRedirects());
  const filtered = removeLine(existing, from);
  if (filtered.length === existing.length) return null;

  await writeRedirects(filtered, `redirect-remove: ${clean}`);
  return { from };
}

module.exports = {
  ensureCleanUrlRedirect,
  removeCleanUrlRedirect
};
