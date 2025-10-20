// pages.save.js
const { db, FieldValue } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const body = JSON.parse(event.body || '{}');

    const slug = (body.slug || '').trim();
    if (!slug) return badRequest('slug is required');

    const builder = body.builder && Array.isArray(body.builder.blocks)
      ? { version: body.builder.version || 1, blocks: body.builder.blocks }
      : { version: 1, blocks: [] };
    const source = body.source || null;

    const doc = {
      slug,
      status: body.status || 'draft', // draft|published|scheduled
      scheduleAt: body.scheduleAt || null,
      orgKey: body.orgKey || null,
      title: body.title || {},
      body: body.body || {},
      seo: body.seo || {},
      menu: body.menu || { show: true, order: 10 },
      builder,
      source,
      updatedAt: Date.now(),
      updatedBy: guard.uid
    };

    await db.collection('pages').doc(slug).set(doc, { merge: true });
    return json({ ok: true, slug, status: doc.status, updatedAt: doc.updatedAt });
  } catch (e) {
    return serverError(e);
  }
};
