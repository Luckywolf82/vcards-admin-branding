// stripe.test-payment.js
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { getStripe } = require('./_lib/stripe');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const url = new URL(event.rawUrl);
    const org = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';

    const body = JSON.parse(event.body || '{}');
    if (!body.priceId) return badRequest('priceId required');

    const successUrl = body.successUrl || 'https://example.com/success';
    const cancelUrl  = body.cancelUrl  || 'https://example.com/cancel';

    const { stripe } = await getStripe(org);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: body.priceId, quantity: Math.max(1, body.quantity || 1) }],
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl
    });

    return json({ checkoutUrl: session.url });
  } catch (e) {
    return serverError(e);
  }
};
