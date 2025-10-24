// pages.publish.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { commitFile, BRANCH, GitHubConfigError, readFile } = require('./_lib/github');
const { normalizeSlug, slugToDocId, slugToPaths, slugPreviewUrl, extractParts } = require('./_lib/pages');
const { ensureCleanUrlRedirect } = require('./_lib/redirects');

const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://nfcking.no').replace(/\/+$/, '');
const DEFAULT_OG_IMAGE = process.env.DEFAULT_OG_IMAGE
  || 'https://raw.githubusercontent.com/Luckywolf82/vcards-admin-branding/main/assets/NFCKING_dark.png';

function toAbsoluteUrl(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed) return SITE_ORIGIN;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${SITE_ORIGIN}${normalized}`;
}

function htmlTemplate({ slug, title, desc, bodyHtml, og, canonical }) {
  const pageTitle = title || 'NFCKING';
  const metaDesc = desc || '';
  const canonicalUrl = toAbsoluteUrl(canonical || slugPreviewUrl(slug));
  const ogUrl = og ? toAbsoluteUrl(og) : DEFAULT_OG_IMAGE;
  const navState = {
    admin: slug === 'index',
    order: slug === 'bestill-kort',
    demo: slug === 'demo',
    super: slug === 'admin-super'
  };

  const normalizedBody = (bodyHtml && bodyHtml.trim())
    ? bodyHtml.trim()
    : '<section class="page-section"><h1>Mangler innhold</h1><p>Innholdet blir tilgjengelig snart.</p></section>';
  const hasMainWrapper = /<main[\s>]/i.test(normalizedBody);
  const contentHtml = hasMainWrapper
    ? normalizedBody
    : `<main class="page-content">${normalizedBody}</main>`;

  return `<!doctype html>
<html lang="no">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(metaDesc)}" />
<meta property="og:site_name" content="NFCKING" />
<meta property="og:title" content="${escapeHtml(pageTitle)}" />
<meta property="og:description" content="${escapeHtml(metaDesc)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta property="og:image" content="${escapeHtml(ogUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
<meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
<meta name="twitter:image" content="${escapeHtml(ogUrl)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
<style>
  :root{color-scheme:dark;}
  body{margin:0;background:#0b0b10;color:#e9eef5;font-family:'Inter','Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;}
  a{color:#8fd3ff;text-decoration:none;transition:color .15s ease-in-out;}
  a:hover{color:#fff;}
  .site-nav{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 18px;background:rgba(11,11,16,.94);border-bottom:1px solid #1f2a36;backdrop-filter:blur(12px);}
  .site-nav__home{display:inline-flex;align-items:center;gap:10px;font-weight:700;color:#cfe3ff;text-decoration:none;text-transform:uppercase;letter-spacing:.04em;font-size:.85rem;}
  .site-nav__home img{height:32px;width:auto;filter:drop-shadow(0 0 6px #3fffd2);}
  .site-nav__links{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .site-nav__link{display:inline-flex;align-items:center;justify-content:center;padding:8px 14px;border-radius:999px;text-decoration:none;font-weight:600;background:#1a2432;color:#cfe3ff;border:1px solid #222f3f;transition:background .15s ease-in-out,color .15s ease-in-out,border-color .15s ease-in-out;}
  .site-nav__link:hover{background:#273449;color:#fff;}
  .site-nav__link[aria-current="page"]{background:#8fd3ff;color:#03101a;border-color:#8fd3ff;}
  .site-nav__link--hidden{display:none !important;}
  main.page-content{max-width:940px;margin:0 auto;padding:32px 20px 72px;}
  main.page-content > * + *{margin-top:1.6rem;}
  main.page-content h1{margin:0;font-size:2.4rem;line-height:1.1;color:#f5f9ff;}
  main.page-content h2{margin:2.4rem 0 .8rem;font-size:1.8rem;color:#f5f9ff;}
  main.page-content h3{margin:1.8rem 0 .6rem;font-size:1.4rem;color:#f5f9ff;}
  main.page-content p{margin:0;color:#cbd5e5;line-height:1.7;font-size:1.05rem;}
  main.page-content p + p{margin-top:1rem;}
  main.page-content ul,main.page-content ol{margin:0 0 0 1.3rem;color:#cbd5e5;line-height:1.6;}
  main.page-content li + li{margin-top:.4rem;}
  main.page-content figure{margin:0;}
  main.page-content figcaption{margin-top:.6rem;font-size:.9rem;color:#9fb3c8;}
  main.page-content img{max-width:100%;height:auto;border-radius:14px;display:block;box-shadow:0 12px 32px rgba(3,16,26,.45);}
  main.page-content blockquote{margin:1.8rem 0;padding:1rem 1.2rem;border-left:4px solid #8fd3ff;background:#12131a;border-radius:0 12px 12px 0;color:#d7e5f5;}
  .two-columns{display:grid;gap:24px;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;}
  .two-columns.stack{grid-template-columns:minmax(0,1fr);}
  @media(max-width:900px){.two-columns{grid-template-columns:minmax(0,1fr);} }
  .button{display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:999px;background:#8fd3ff;color:#03101a;font-weight:700;text-decoration:none;border:0;box-shadow:0 6px 18px rgba(2,40,63,.25);}
  .button.secondary{background:transparent;color:#8fd3ff;border:1px solid #456080;box-shadow:none;}
  .button + .button{margin-left:12px;}
  .link{color:#8fd3ff;text-decoration:underline;font-weight:600;}
  .contact-form{background:#12131a;padding:24px;border-radius:16px;border:1px solid #1f2a36;box-shadow:0 12px 32px rgba(3,16,26,.32);}
  .contact-form form{display:grid;gap:14px;margin-top:12px;}
  .contact-form label{display:grid;gap:6px;font-weight:600;color:#e9eef5;}
  .contact-form input,.contact-form textarea{background:#0f141a;color:#e9eef5;border:1px solid #2a3442;border-radius:8px;padding:10px;}
  .contact-form textarea{min-height:140px;resize:vertical;}
  .contact-form button{justify-self:start;background:#8fd3ff;color:#03101a;border:0;border-radius:999px;padding:12px 22px;font-weight:700;cursor:pointer;}
  .contact-form button:hover{background:#a6dcff;}
  .contact-form .contact-success{margin:0;color:#21c36a;font-weight:600;}
  footer.page-footer{margin-top:48px;font-size:.9rem;color:#7f92ab;text-align:center;}
</style>
</head>
<body>
<header class="site-nav">
  <a class="site-nav__home" href="/index.html">
    <img src="/assets/NFCKING_dark.png" alt="NFCKING logo" />
    <span>NFCKING</span>
  </a>
  <nav class="site-nav__links">
    <a class="site-nav__link" href="/index.html"${navState.admin ? ' aria-current="page"' : ''}>Admin</a>
    <a class="site-nav__link" href="/bestill-kort.html"${navState.order ? ' aria-current="page"' : ''}>Bestill kort</a>
    <a class="site-nav__link" href="/demo.html"${navState.demo ? ' aria-current="page"' : ''}>Demo</a>
    <a class="site-nav__link site-nav__link--hidden" href="/admin-super.html" data-nav-superadmin${navState.super ? ' aria-current="page"' : ''}>Superadmin</a>
  </nav>
</header>
${contentHtml}
<script>
  (function(){
    try {
      const navSuper = document.querySelector('[data-nav-superadmin]');
      if (!navSuper) return;
      const isSuper = localStorage.getItem('nfcking:isSuperAdmin') === '1';
      navSuper.classList.toggle('site-nav__link--hidden', !isSuper);
    } catch (err) {
      // Ignorer dersom localStorage ikke er tilgjengelig
    }
  })();
</script>
</body>
</html>`;
}
function escapeHtml(s=''){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function stripNavAndScript(body = '') {
  if (!body) return '';
  let cleaned = String(body);
  cleaned = cleaned.replace(/<header\s+class="site-nav"[\s\S]*?<\/header>/i, '').trim();
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (snippet) => (
    /(nfcking:isSuperAdmin|data-nav-superadmin)/i.test(snippet) ? '' : snippet
  )).trim();
  return cleaned.trim();
}

async function loadFallbackDoc(slug, path) {
  let html;
  try {
    html = await readFile(path);
  } catch (err) {
    if (err instanceof GitHubConfigError) throw err;
    throw err;
  }
  if (!html) return null;

  const parts = extractParts(html);
  const canonical = slugPreviewUrl(slug);
  const cleanedBody = stripNavAndScript(parts.body || '');
  const bodyHtml = (cleanedBody || parts.body || '').trim();
  const title = parts.title || slug;
  const description = parts.description || '';

  return {
    bodyHtml,
    storeData: {
      slug,
      status: 'published',
      scheduleAt: null,
      orgKey: null,
      title: { nb: title, en: title },
      body: { nb: bodyHtml, en: bodyHtml },
      seo: {
        title,
        description,
        ogImage: '',
        canonical
      },
      menu: { show: true, order: 10 },
      builder: { version: 1, blocks: [] },
      source: { origin: 'repo', path }
    }
  };
}

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const body = JSON.parse(event.body || '{}');
    const slug = normalizeSlug(body.slug || '');
    if (!slug) return badRequest('slug is required');

    const docId = slugToDocId(slug);
    if (!docId) return badRequest('slug is required');

    const paths = slugToPaths(slug);
    if (!paths.length) return badRequest('invalid slug');

    const docRef = db.collection('pages').doc(docId);
    const docSnap = await docRef.get();
    let data = docSnap.exists ? docSnap.data() : null;
    let fallback = null;

    let usedFallbackPath = null;
    if (!data) {
      for (const candidate of paths) {
        const loaded = await loadFallbackDoc(slug, candidate);
        if (loaded) {
          fallback = loaded;
          usedFallbackPath = candidate;
          break;
        }
      }
      if (!fallback) return badRequest('page not found');
      data = fallback.storeData;
    }

    // velg norsk som default hvis finnes
    const title = data.seo?.title || data.title?.nb || data.title?.en
      || fallback?.storeData?.title?.nb || slug;
    const desc  = data.seo?.description
      || fallback?.storeData?.seo?.description || '';
    const og    = data.seo?.ogImage || fallback?.storeData?.seo?.ogImage || '';
    const canonical = data.seo?.canonical || fallback?.storeData?.seo?.canonical || slugPreviewUrl(slug);
    const bodyHtml = data.body?.nb || data.body?.en || fallback?.bodyHtml || '';

    const html = htmlTemplate({ slug, title, desc, bodyHtml, og, canonical });

    const committedPaths = [];
    for (const path of paths) {
      await commitFile({
        path,
        content: html,
        message: `publish: ${slug}`
      });
      committedPaths.push(path);
    }

    let redirectInfo = null;
    try {
      redirectInfo = await ensureCleanUrlRedirect(slug);
    } catch (redirectErr) {
      console.warn('pages-publish: failed to ensure redirect', redirectErr.message);
    }

    // oppdatér status i Firestore
    const updatePayload = fallback
      ? {
          ...fallback.storeData,
          status: 'published',
          updatedAt: Date.now(),
          updatedBy: guard.uid
        }
      : {
          status: 'published',
          updatedAt: Date.now(),
          updatedBy: guard.uid
        };

    await docRef.set(updatePayload, { merge: true });

    const fileUrls = committedPaths.map((path) => `/${String(path || '').replace(/^\/+/, '')}`);
    const previewUrl = slugPreviewUrl(slug);

    return json({
      ok: true,
      slug,
      branch: BRANCH,
      paths: committedPaths,
      urls: fileUrls,
      previewUrl,
      fallbackPath: usedFallbackPath || null,
      redirect: redirectInfo
    });
  } catch (e) {
    if (e instanceof GitHubConfigError) {
      return json({ error: 'github_config', message: e.message, missing: e.missing }, 500);
    }
    return serverError(e);
  }
};
