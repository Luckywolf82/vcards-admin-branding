const { requireRole, json, CORS_HEADERS } = require('./_lib/auth');
const { saveSmtpSettings, sanitizeSmtpForClient } = require('./_lib/settings');

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
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
    const body = parseBody(event);

    const payload = {
      host: body.host || '',
      port: body.port,
      secure: body.secure,
      user: body.user || '',
      from: body.from || '',
      replyTo: body.replyTo || '',
      enabled: body.enabled,
      pass: Object.prototype.hasOwnProperty.call(body, 'pass') ? body.pass : null,
    };

    const saved = await saveSmtpSettings(payload, {
      updatedBy: actor.email || actor.uid || null,
      uid: actor.uid || null,
    });

    return json({ ok: true, smtp: sanitizeSmtpForClient(saved) });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
