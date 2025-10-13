// nfc-batches.create.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');

    const body = JSON.parse(event.body || '{}');
    const orgKey = body.orgKey || guard.claims.orgKey || 'Wayback';
    const presetId = body.presetId || null;
    const source = body.source || 'orders-filter';
    const ndef = body.ndef || { type:'URL', value:'https://nfcking.no/u/{orderId}', lock:true };
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds : [];

    const batch = {
      orgKey, source, presetId, ndef,
      status: 'draft',
      count: orderIds.length || 0,
      orderIds,
      createdAt: Date.now(),
      createdBy: guard.uid
    };

    const ref = await db.collection('nfc_batches').add(batch);
    return json({ id: ref.id, status: 'draft', count: batch.count }, 201);
  } catch (e) {
    return serverError(e);
  }
};
