const { requireRole, json, CORS_HEADERS } = require('./_lib/auth');
const { loadSmtpConfig, sendSmtpMail } = require('./_lib/settings');

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

    const to = (body.to || actor.email || '').trim();
    const subject = (body.subject || 'NFCKING – SMTP test').trim();
    const message = body.message || 'Dette er en test sendt fra NFCKING superadmin.';

    if (!to) {
      return json({ ok: false, error: 'Mangler mottakeradresse' }, 400);
    }

    const config = await loadSmtpConfig();
    if (!config) {
      return json({ ok: false, error: 'SMTP er ikke konfigurert. Lagre oppsettet først.' }, 400);
    }

    await sendSmtpMail(config, {
      to,
      subject,
      text: String(message || ''),
      html: `<p>${escapeHtml(message)}</p>`,
    });

    return json({ ok: true, deliveredTo: to, source: config.source });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Internal error' }, err.statusCode || 500);
  }
};
