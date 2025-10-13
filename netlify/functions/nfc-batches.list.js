// nfc-batches.list.js
const { db } = require('./_lib/firebaseAdmin');
const { json, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const status = url.searchParams.get('status') || '';
    const org = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

    let ref = db.collection('nfc_batches').where('orgKey','==',org);
    if (status) ref = ref.where('status','==',status);
    ref = ref.orderBy('createdAt','desc').limit(limit);

    const snap = await ref.get();
    const data = [];
    snap.forEach(doc=>{
      const d = doc.data();
      data.push({
        id: doc.id,
        status: d.status,
        count: d.count || (d.orderIds?.length || 0),
        presetId: d.presetId || null,
        createdAt: d.createdAt || null
      });
    });

    return json({ data, hasMore: false });
  } catch (e) {
    return serverError(e);
  }
};
