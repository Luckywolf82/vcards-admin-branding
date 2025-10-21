const { requireRole, json, CORS_HEADERS } = require('./_lib/auth');
const { getSmtpSettings, sanitizeSmtpForClient, getEnvSmtpConfig } = require('./_lib/settings');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    await requireRole(event, 'superadmin');
    const stored = await getSmtpSettings();
    const smtp = sanitizeSmtpForClient(stored);
    const envInfo = getEnvSmtpConfig(false);
    const activeSource = envInfo
      ? 'env'
      : smtp.host && smtp.enabled
      ? 'stored'
      : 'none';

    const envSummary = envInfo
      ? {
          host: envInfo.host,
          from: envInfo.from,
          port: envInfo.port,
          secure: envInfo.secure,
        }
      : null;

    return json({ ok: true, smtp, activeSource, env: envSummary });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
