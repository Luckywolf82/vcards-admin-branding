// orders.list.js
const { db } = require('./_lib/firebaseAdmin');
const { json, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const status = url.searchParams.get('status') || '';
    const org    = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';
    const qText  = (url.searchParams.get('q') || '').toLowerCase();
    const limit  = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

    let ref = db.collection('orders').where('orgKey','==',org);
    if (status) ref = ref.where('status','==',status);
    ref = ref.orderBy('createdAt','desc').limit(limit);

    const snap = await ref.get();
    const out = [];
    snap.forEach(doc => {
      const d = doc.data();
      const blob = [
        d.customer?.name || '', d.customer?.email || '',
        (d.items||[]).map(x=>x.name||x.sku||'').join(' ')
      ].join(' ').toLowerCase();
      if (qText && !blob.includes(qText)) return;
      out.push({
        id: doc.id,
        createdAt: d.createdAt || null,
        status: d.status || 'new',
        customer: { name: d.customer?.name || '', email: d.customer?.email || '' },
        items: (d.items||[]).map(x=>({ sku:x.sku, name:x.name, qty:x.qty, unit:x.unit, currency:x.currency })),
        amountTotal: d.amountTotal || 0,
        stripe: d.stripe || {}
      });
    });

    return json({ data: out, count: out.length, hasMore: false });
  } catch (e) {
    return serverError(e);
  }
};
