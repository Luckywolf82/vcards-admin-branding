// orders.update.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');

    const body = JSON.parse(event.body || '{}');
    const id = (body.id || '').trim();
    if (!id) return badRequest('id required');

    const patch = {};
    if (body.status) patch.status = body.status;
    if (body.shipping) patch.shipping = body.shipping;
    if (typeof body.notes === 'string') patch.notes = body.notes;
    patch.updatedAt = Date.now();
    patch.updatedBy = guard.uid;

    await db.collection('orders').doc(id).set(patch, { merge: true });
    return json({ ok: true, updated: Object.keys(patch).filter(k=>!['updatedAt','updatedBy'].includes(k)) });
  } catch (e) {
    return serverError(e);
  }
};
