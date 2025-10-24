// pages.delete.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { deleteFile } = require('./_lib/github');
const { normalizeSlug, slugToDocId, slugToPaths } = require('./_lib/pages');
const { removeCleanUrlRedirect } = require('./_lib/redirects');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const body = JSON.parse(event.body || '{}');
    const slug = normalizeSlug(body.slug || '');
    if (!slug) return badRequest('slug is required');

    const docId = slugToDocId(slug);
    if (docId) {
      await db.collection('pages').doc(docId).delete().catch(()=> null);
    }

    // (Valgfritt) forsøk å slette publisert fil
    const paths = slugToPaths(slug);
    for (const path of paths) {
      try {
        await deleteFile({ path, message: `delete page: ${slug}` });
      } catch (e) {
        console.warn('GitHub delete failed (ok to ignore):', e.message);
      }
    }

    try {
      await removeCleanUrlRedirect(slug);
    } catch (redirectErr) {
      console.warn('pages-delete: failed to remove redirect', redirectErr.message);
    }

    return json({ ok: true, slug });
  } catch (e) {
    return serverError(e);
  }
};

