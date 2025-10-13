// menu.save.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const body = JSON.parse(event.body || '{}');
    const org  = body.org || guard.claims.orgKey || 'Wayback';
    const nav  = Array.isArray(body.nav) ? body.nav : null;
    if (!nav) return badRequest('nav array required');

    // Enkel validering
    const clean = nav
      .filter(x => x && typeof x === 'object')
      .map(x => ({ label: String(x.label||'').trim(), href: String(x.href||'').trim() }))
      .filter(x => x.label && x.href);

    await db.collection('orgs').doc(org).set({ nav: clean }, { merge: true });
    return json({ ok: true, org, count: clean.length });
  } catch (e) {
    return serverError(e);
  }
};
