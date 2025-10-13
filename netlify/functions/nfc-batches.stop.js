// nfc-batches.stop.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const body = JSON.parse(event.body || '{}');
    const id = (body.id || '').trim(); if (!id) return badRequest('id required');

    await db.collection('nfc_batches').doc(id).set({ status:'stopped', updatedAt: Date.now() }, { merge:true });
    return json({ ok: true, status:'stopped' });
  } catch (e) { return serverError(e); }
};
