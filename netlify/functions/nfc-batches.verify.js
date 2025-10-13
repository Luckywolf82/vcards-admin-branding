// nfc-batches.verify.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');

    const body = JSON.parse(event.body || '{}');
    const batchId = (body.batchId || '').trim();
    const chipUID = (body.chipUID || '').trim();
    const result = body.result || 'success';
    const payloadHash = body.payloadHash || null;
    if (!batchId || !chipUID) return badRequest('batchId, chipUID required');

    // Finn/lag jobb
    const jobId = `${batchId}::${chipUID}`;
    await db.collection('nfc_jobs').doc(jobId).set({
      batchId, chipUID,
      steps: { verify: { status: 'done', ts: Date.now() } },
      payloadHash,
      result,
      updatedAt: Date.now()
    }, { merge: true });

    // Oppdater batch status hvis alt verifisert (enkel heuristikk)
    await db.collection('nfc_batches').doc(batchId).set({ updatedAt: Date.now() }, { merge: true });

    return json({ ok: true });
  } catch (e) { return serverError(e); }
};
