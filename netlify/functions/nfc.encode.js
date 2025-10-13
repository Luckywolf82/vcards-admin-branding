// nfc.encode.js
// Registrerer encoding-resultat på en enkelt jobb (eller oppretter en hvis den ikke finnes).
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');

    const body = JSON.parse(event.body || '{}');
    const orderId = (body.orderId || '').trim();
    const chipUID = (body.chipUID || '').trim();
    const payload = body.payload || null;
    const lock = !!body.lock;
    if (!orderId || !chipUID || !payload) return badRequest('orderId, chipUID, payload required');

    // Opprett/oppdater jobb
    const jobRef = db.collection('nfc_jobs').doc(`${orderId}::${chipUID}`);
    await jobRef.set({
      orderId, chipUID,
      steps: {
        ...(body.steps || {}),
        encode: { status: 'done', ts: Date.now(), payloadHash: JSON.stringify(payload).length }
      },
      result: 'pending',
      updatedAt: Date.now()
    }, { merge: true });

    // Oppdater ordre med verify-url (for demo)
    const verifyUrl = `https://nfcking.no/u/${orderId}`;
    await db.collection('orders').doc(orderId).set({ nfc: { chipUID, lock, payload, verifyUrl } }, { merge: true });

    return json({ ok: true, verifyUrl });
  } catch (e) { return serverError(e); }
};

