// pages.list.js
const { db } = require('./_lib/firebaseAdmin');
const { json, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { getRepoTree } = require('./_lib/github');
const { slugFromPath, isSitePagePath, slugPreviewUrl, slugToPath } = require('./_lib/pages');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const status = url.searchParams.get('status') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);

    let ref = db.collection('pages');
    if (status) ref = ref.where('status', '==', status);

    // Sorter på updatedAt desc (kan kreve index)
    ref = ref.orderBy('updatedAt', 'desc').limit(limit);

    const snap = await ref.get();
    const map = new Map();
    snap.forEach(doc => {
      const d = doc.data();
      if (q) {
        const blob = [
          doc.id, d.slug, d.status,
          (d.title?.nb || ''), (d.title?.en || '')
        ].join(' ').toLowerCase();
        if (!blob.includes(q)) return;
      }
      const slug = d.slug || doc.id;
      map.set(slug, {
        slug,
        status: d.status || 'draft',
        title: d.title || {},
        updatedAt: d.updatedAt || null,
        path: slugToPath(slug) || '',
        previewUrl: slugPreviewUrl(slug)
      });
    });

    try {
      const tree = await getRepoTree();
      tree
        .filter(node => node.type === 'blob' && isSitePagePath(node.path))
        .forEach(node => {
          const slug = slugFromPath(node.path);
          if (!slug) return;
          if (q && !slug.toLowerCase().includes(q)) {
            // skip when query provided and slug mismatch
            const existing = map.get(slug);
            if (!existing) return;
          }
          if (!map.has(slug)) {
            map.set(slug, {
              slug,
              status: 'published',
              title: {},
              updatedAt: null,
              path: node.path,
              previewUrl: slugPreviewUrl(slug)
            });
          } else {
            const existing = map.get(slug);
            if (!existing.path) existing.path = node.path;
            if (!existing.previewUrl) existing.previewUrl = slugPreviewUrl(slug);
          }
        });
    } catch (err) {
      console.warn('pages-list: repo tree lookup failed', err.message);
    }

    const pages = Array.from(map.values()).sort((a, b) => a.slug.localeCompare(b.slug));

    return json({ pages, count: pages.length });
  } catch (e) {
    return serverError(e);
  }
};
