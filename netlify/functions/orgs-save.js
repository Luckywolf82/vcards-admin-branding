const { db, FieldValue } = require('./_lib/firebaseAdmin');
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

function parseLimit(value) {
  if (value === undefined) return { provided: false, value: null };
  if (value === null) return { provided: true, value: null };
  const str = cleanString(value);
  if (!str) return { provided: true, value: null };
  if (!/^\d+$/.test(str)) {
    throw new Error('Maks ansatte/kort må være et heltall større eller lik 0.');
  }
  const num = Number(str);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('Maks ansatte/kort må være et heltall større eller lik 0.');
  }
  return { provided: true, value: Math.floor(num) };
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

    const limit = parseLimit(
      body.employeeLimit ?? body.limit ?? body.maxEmployees ?? body.maxCards ?? body.cardLimit
    );

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

    let deleteSentinel = null;
    if (limit.provided) {
      if (limit.value === null) {
        deleteSentinel = FieldValue.delete();
        payload.employeeLimit = deleteSentinel;
      } else {
        payload.employeeLimit = limit.value;
      }
    }

    await docRef.set(payload, { merge: true });

    const responseOrg = {
      key,
      name,
      site,
      accent,
      logo,
      logoBg,
      updatedAt: payload.updatedAt,
      createdAt: payload.createdAt,
    };

    if (limit.provided) {
      responseOrg.employeeLimit = limit.value;
    } else if (typeof existing.employeeLimit === 'number') {
      responseOrg.employeeLimit = existing.employeeLimit;
    }

    if (deleteSentinel) {
      responseOrg.employeeLimit = null;
    }

    return json({ ok: true, org: responseOrg });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
