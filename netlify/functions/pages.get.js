// pages.get.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const slug = url.searchParams.get('slug');
    if (!slug) return badRequest('slug is required');

    const doc = await db.collection('pages').doc(slug).get();
    if (!doc.exists) return json({ notFound: true }, 404);

    return json({ slug, ...doc.data() });
  } catch (e) {
    return serverError(e);
  }
};
