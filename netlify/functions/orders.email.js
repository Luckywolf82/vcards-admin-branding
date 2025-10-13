// orders.email.js
// Placeholder: logger "sendt" og skriver audit. Bytt med SendGrid/Resend/SES senere.
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');

    const body = JSON.parse(event.body || '{}');
    const id = (body.id || '').trim();
    const to = (body.to || '').trim();
    if (!id) return badRequest('id required');
    // hent e-post fra ordre hvis "to" mangler
    const ordDoc = await db.collection('orders').doc(id).get();
    if (!to && ordDoc.exists) body.to = ordDoc.data().customer?.email || '';
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@nfcking>`;

    // Audit-logg
    await db.collection('audit_logs').add({
      ts: Date.now(), actor: guard.uid, action: 'orders.email', targetId: id,
      data: { template: body.template, subject: body.subject, to: body.to, messageId }
    });

    console.log('EMAIL_PLACEHOLDER', { orderId: id, ...body, messageId });
    return json({ sent: true, to: body.to, messageId });
  } catch (e) {
    return serverError(e);
  }
};
