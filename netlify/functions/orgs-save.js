const { db } = require('./_lib/firebaseAdmin');
const { requireRole, json, CORS_HEADERS, normaliseOrgKey } = require('./_lib/auth');

function cleanString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function cleanUrl(value) {
  const str = cleanString(value);
  if (!str) return '';
  if (/^https?:\/\//i.test(str)) return str;
  return `https://${str}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const actor = await requireRole(event, 'superadmin');
    const body = JSON.parse(event.body || '{}');
    const key = normaliseOrgKey(body.key || body.orgKey || body.id || body.slug);
    if (!key) {
      return json({ ok: false, error: 'Ugyldig org-nøkkel (tillatte tegn: A-Z, 0-9, -, _).' }, 400);
    }

    const name = cleanString(body.name) || key;
    const site = cleanUrl(body.site);
    const accent = cleanString(body.accent);
    const logo = cleanString(body.logo);
    const logoBg = cleanString(body.logoBg);

    const now = new Date().toISOString();
    const docRef = db.collection('orgs').doc(key);
    const snap = await docRef.get();
    const existing = snap.exists ? snap.data() || {} : {};

    const payload = {
      name,
      site,
      accent,
      logo,
      logoBg,
      updatedAt: now,
    };

    const updatedBy = cleanString(actor.email || actor.uid || '');
    if (updatedBy) {
      payload.updatedBy = updatedBy;
    }

    if (!snap.exists) {
      payload.createdAt = now;
    } else if (existing.createdAt) {
      payload.createdAt = existing.createdAt;
    } else {
      payload.createdAt = now;
    }

    await docRef.set(payload, { merge: true });

    return json({ ok: true, org: { key, ...payload } });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
