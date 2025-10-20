const { db } = require('./_lib/firebaseAdmin');
const { requireRole, json, CORS_HEADERS } = require('./_lib/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const actor = await requireRole(event, 'viewer');
    const url = new URL(event.rawUrl);
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();

    const snapshot = await db.collection('orgs').get();
    const records = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      const key = doc.id;
      const name = (data.name || '').toString().trim();
      const site = (data.site || '').toString().trim();
      const accent = (data.accent || '').toString().trim();
      const logo = (data.logo || '').toString().trim();
      const logoBg = (data.logoBg || '').toString().trim();
      let employeeLimit = null;
      if (typeof data.employeeLimit === 'number' && Number.isFinite(data.employeeLimit) && data.employeeLimit >= 0) {
        employeeLimit = Math.floor(data.employeeLimit);
      }

      let updatedAt = data.updatedAt || null;
      if (updatedAt && typeof updatedAt.toDate === 'function') {
        updatedAt = updatedAt.toDate().toISOString();
      }
      let createdAt = data.createdAt || null;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate().toISOString();
      }

      records.push({
        key,
        name: name || key,
        site,
        accent,
        logo,
        logoBg,
        employeeLimit,
        updatedAt,
        createdAt,
      });
    });

    let visible = records;
    if (!actor.orgsAll) {
      const allowed = new Set(Array.isArray(actor.orgs) ? actor.orgs : []);
      visible = records.filter((org) => allowed.has(org.key));
    }

    if (query) {
      visible = visible.filter((org) => {
        const keyMatch = org.key.toLowerCase().includes(query);
        const nameMatch = (org.name || '').toLowerCase().includes(query);
        const siteMatch = (org.site || '').toLowerCase().includes(query);
        return keyMatch || nameMatch || siteMatch;
      });
    }

    visible.sort((a, b) => a.key.localeCompare(b.key));

    return json({ ok: true, orgs: visible, count: visible.length });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
