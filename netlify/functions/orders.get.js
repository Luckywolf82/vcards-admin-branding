// orders.get.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    const url = new URL(event.rawUrl);
    const id = url.searchParams.get('id');
    if (!id) return badRequest('id required');

    const doc = await db.collection('orders').doc(id).get();
    if (!doc.exists) return json({ notFound: true }, 404);
    return json({ id, ...doc.data() });
  } catch (e) {
    return serverError(e);
  }
};
