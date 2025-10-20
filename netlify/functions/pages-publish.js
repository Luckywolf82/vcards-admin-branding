// pages.publish.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { commitFile, BRANCH } = require('./_lib/github');
const { slugToPath, slugPreviewUrl } = require('./_lib/pages');

function htmlTemplate({ title, desc, bodyHtml, og, canonical }) {
  const pageTitle = title || 'NFCKING';
  const metaDesc = desc || '';
  const ogImg = og || '';
  const canonicalHref = canonical || '/';
  return `<!doctype html>
<html lang="no">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(metaDesc)}" />
${ogImg ? `<meta property="og:image" content="${escapeHtml(ogImg)}" />` : ''}
<link rel="canonical" href="${escapeHtml(canonicalHref)}" />
</head>
<body>
${bodyHtml || ''}

</body>
</html>`;
}
function escapeHtml(s=''){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const body = JSON.parse(event.body || '{}');
    const slug = (body.slug || '').trim();
    if (!slug) return badRequest('slug is required');

    const doc = await db.collection('pages').doc(slug).get();
    if (!doc.exists) return badRequest('page not found');

    const d = doc.data();
    // velg norsk som default hvis finnes
    const title = d.seo?.title || d.title?.nb || d.title?.en || slug;
    const desc  = d.seo?.description || '';
    const og    = d.seo?.ogImage || '';
    const canonical = d.seo?.canonical || slugPreviewUrl(slug);
    const bodyHtml = d.body?.nb || d.body?.en || '<main><h1>Mangler innhold</h1></main>';

    const html = htmlTemplate({ title, desc, bodyHtml, og, canonical });

    const path = slugToPath(slug);
    if (!path) return badRequest('invalid slug');
    await commitFile({
      path,
      content: html,
      message: `publish: ${slug}`
    });

    // oppdatér status i Firestore
    await db.collection('pages').doc(slug).set({
      status: 'published',
      updatedAt: Date.now(),
      updatedBy: guard.uid
    }, { merge: true });

    return json({ ok: true, slug, branch: BRANCH, path: `/${path}` });
  } catch (e) {
    return serverError(e);
  }
};
