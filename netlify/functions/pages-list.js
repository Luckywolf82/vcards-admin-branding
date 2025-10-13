// pages.list.js
const { db } = require('./_lib/firebaseAdmin');
const { json, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

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
    const pages = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (q) {
        const blob = [
          doc.id, d.slug, d.status,
          (d.title?.nb || ''), (d.title?.en || '')
        ].join(' ').toLowerCase();
        if (!blob.includes(q)) return;
      }
      pages.push({
        slug: d.slug || doc.id,
        status: d.status || 'draft',
        title: d.title || {},
        updatedAt: d.updatedAt || null
      });
    });

    return json({ pages, count: pages.length });
  } catch (e) {
    return serverError(e);
  }
};
