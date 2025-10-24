const SLUG_BLOCKLIST_PREFIX = [
  'netlify/',
  'scripts/',
  'assets/',
  'node_modules/',
  'Vcards/',
  '.netlify/'
];

function normalizeSlug(slug = '') {
  return String(slug || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function slugToDocId(slug = '') {
  const safe = normalizeSlug(slug);
  if (!safe) return null;
  return encodeURIComponent(safe);
}

function docIdToSlug(id = '') {
  if (!id) return '';
  try {
    return normalizeSlug(decodeURIComponent(id));
  } catch (err) {
    return normalizeSlug(id);
  }
}

function slugToPath(slug = '') {
  const safe = normalizeSlug(slug);
  if (!safe) return null;
  if (safe === 'index') return 'index.html';
  if (safe.endsWith('.html')) return safe;
  if (safe.includes('/')) return `${safe}/index.html`;
  return `${safe}.html`;
}

function slugToPaths(slug = '') {
  const primary = slugToPath(slug);
  if (!primary) return [];

  const safe = normalizeSlug(slug);
  const extras = [];
  if (safe && !safe.includes('/') && !safe.endsWith('.html') && safe !== 'index') {
    extras.push(`${safe}/index.html`);
  }

  return Array.from(new Set([primary, ...extras]));
}

function slugPreviewUrl(slug = '') {
  const safe = normalizeSlug(slug);
  if (!safe || safe === 'index') return '/';
  return `/${safe}`;
}

function slugFromPath(path = '') {
  const clean = String(path || '').replace(/^\/+/,'');
  if (!clean) return '';
  if (clean === 'index.html') return 'index';
  if (clean.endsWith('/index.html')) {
    return clean.replace(/\/index\.html$/, '');
  }
  if (clean.endsWith('.html')) {
    return clean.replace(/\.html$/, '');
  }
  return clean;
}

function isSitePagePath(path = '') {
  const clean = String(path || '');
  if (!clean.endsWith('.html')) return false;
  return !SLUG_BLOCKLIST_PREFIX.some(prefix => clean.startsWith(prefix));
}

function extractParts(html = '') {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    body: bodyMatch ? bodyMatch[1].trim() : html.trim()
  };
}

module.exports = {
  normalizeSlug,
  slugToDocId,
  docIdToSlug,
  slugToPath,
  slugToPaths,
  slugPreviewUrl,
  slugFromPath,
  isSitePagePath,
  extractParts
};
