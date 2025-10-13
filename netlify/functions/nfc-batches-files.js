// nfc-batches.files.js
// Returnerer en "downloadUrl" placeholder. Bytt til faktisk generert ZIP i Storage.
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    const url = new URL(event.rawUrl);
    const id = url.searchParams.get('id'); if (!id) return badRequest('id required');
    const type = url.searchParams.get('type') || 'zip';
    return json({ downloadUrl: `/media/nfc/${id}/export.${type}`, expires: new Date(Date.now()+60*60*1000).toISOString() });
  } catch (e) { return serverError(e); }
};
