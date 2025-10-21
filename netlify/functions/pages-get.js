// pages.get.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { readFile } = require('./_lib/github');
const { slugToPath, slugPreviewUrl, extractParts } = require('./_lib/pages');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const slug = url.searchParams.get('slug');
    if (!slug) return badRequest('slug is required');

    const doc = await db.collection('pages').doc(slug).get();
    if (doc.exists) {
      const data = doc.data();
      return json({
        slug,
        ...data,
        previewUrl: slugPreviewUrl(slug)
      });
    }

    const path = slugToPath(slug);
    if (!path) return json({ notFound: true }, 404);
    const html = await readFile(path);
    if (!html) return json({ notFound: true }, 404);

    const parts = extractParts(html);
    return json({
      slug,
      status: 'published',
      scheduleAt: null,
      orgKey: null,
      title: { nb: parts.title, en: parts.title },
      body: { nb: parts.body, en: parts.body },
      seo: {
        title: parts.title,
        description: parts.description,
        ogImage: '',
        canonical: slugPreviewUrl(slug)
      },
      menu: { show: true, order: 10 },
      previewUrl: slugPreviewUrl(slug),
      source: { path, origin: 'repo' }
    });
  } catch (e) {
    return serverError(e);
  }
};
