const SLUG_BLOCKLIST_PREFIX = [
  'netlify/',
  'scripts/',
  'assets/',
  'node_modules/',
  'Vcards/',
  '.netlify/'
];

function slugToPath(slug = '') {
  const safe = String(slug || '').trim().replace(/^\/+/,'').replace(/\/+$/, '');
  if (!safe) return null;
  if (safe === 'index') return 'index.html';
  if (safe.endsWith('.html')) return safe;
  if (safe.includes('/')) return `${safe}/index.html`;
  return `${safe}.html`;
}

function slugPreviewUrl(slug = '') {
  const safe = String(slug || '').trim().replace(/^\/+/,'').replace(/\/+$/, '');
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
  slugToPath,
  slugPreviewUrl,
  slugFromPath,
  isSitePagePath,
  extractParts
};
