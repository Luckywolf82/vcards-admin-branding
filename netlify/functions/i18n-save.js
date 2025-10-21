const { requireRole, json, CORS_HEADERS } = require('./_lib/auth');
const { saveI18nSettings } = require('./_lib/i18n');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const user = await requireRole(event, 'superadmin');
    let payload = {};
    if (event.body) {
      try {
        payload = JSON.parse(event.body);
      } catch (err) {
        return json({ ok: false, error: 'Ugyldig JSON-body' }, 400);
      }
    }
    const saved = await saveI18nSettings(payload, {
      uid: user.uid || null,
      email: user.email || null,
      updatedBy: user.email || user.name || user.uid || null,
    });
    return json({ ok: true, settings: saved });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
