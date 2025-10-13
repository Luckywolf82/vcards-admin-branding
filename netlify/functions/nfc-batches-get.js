// nfc-batches.get.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    const url = new URL(event.rawUrl);
    const id = url.searchParams.get('id');
    if (!id) return badRequest('id required');

    const doc = await db.collection('nfc_batches').doc(id).get();
    if (!doc.exists) return json({ notFound: true }, 404);

    // Summér jobs-statistikk
    const stats = { engrave:0, encode:0, verify:0, failed:0 };
    const jobs = await db.collection('nfc_jobs').where('batchId','==',id).limit(500).get();
    jobs.forEach(j=>{
      const s = j.data().steps || {};
      if (s.engrave?.status === 'done') stats.engrave++;
      if (s.encode?.status  === 'done') stats.encode++;
      if (s.verify?.status  === 'done') stats.verify++;
      if ((j.data().result||'') === 'failed') stats.failed++;
    });

    return json({ id, ...doc.data(), stats });
  } catch (e) {
    return serverError(e);
  }
};
