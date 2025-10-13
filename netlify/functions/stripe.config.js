// stripe.config.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { getStripeConfig } = require('./_lib/stripe');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const org = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';

    if (event.httpMethod === 'GET') {
      const cfg = await getStripeConfig(org);
      // returner bare trygge felt:
      return json({
        mode: cfg.mode,
        publishableKey: cfg.publishableKey,
        connect: cfg.connect,
        hasWebhookSecret: !!cfg.webhookSecret
      });
    }

    if (event.httpMethod === 'POST') {
      // Kun superadmin kan endre
      if (!new Set(guard.claims.roles||[]).has('superadmin')) {
        return json({ error:'forbidden', message:'Insufficient role' }, 403);
      }

      const body = JSON.parse(event.body || '{}');
      const payload = {
        mode: body.mode || 'test',
        pubKey: body.publishableKey || '',
        connect: body.connect || { enabled: false }
        // secretKey/webhookSecret håndteres i ENV
      };
      await db.collection('stripe_config').doc(org).set(payload, { merge: true });
      return json({ ok: true, updated: Object.keys(payload), org });
    }

    return badRequest('Use GET or POST');
  } catch (e) {
    return serverError(e);
  }
};
