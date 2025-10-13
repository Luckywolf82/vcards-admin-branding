// menu.get.js
const { db } = require('./_lib/firebaseAdmin');
const { json, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const org = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';

    const doc = await db.collection('orgs').doc(org).get();
    const nav = (doc.exists && Array.isArray(doc.data().nav)) ? doc.data().nav : [
      { label: 'Hjem', href: '/' },
      { label: 'Bestill', href: '/bestill-kort' }
    ];

    return json({ org, nav });
  } catch (e) {
    return serverError(e);
  }
};
