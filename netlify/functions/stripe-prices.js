// stripe.prices.js
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
    if (!body.product) return badRequest('product required');
    if (!body.currency) return badRequest('currency required');
    if (typeof body.unit_amount !== 'number') return badRequest('unit_amount required');

    const { stripe } = await getStripe(org);
    const price = await stripe.prices.create({
      product: body.product,
      currency: body.currency,
      unit_amount: body.unit_amount,
      ...(body.type === 'recurring'
        ? { recurring: { interval: (body.interval || 'month') } }
        : {}),
      active: typeof body.active === 'boolean' ? body.active : true
    });

    return json({ id: price.id, product: body.product }, 201);
  } catch (e) {
    return serverError(e);
  }
};
