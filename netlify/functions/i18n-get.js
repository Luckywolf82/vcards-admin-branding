const { json, CORS_HEADERS } = require('./_lib/auth');
const { getI18nSettings } = require('./_lib/i18n');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const settings = await getI18nSettings();
    return json({ ok: true, ...settings });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
