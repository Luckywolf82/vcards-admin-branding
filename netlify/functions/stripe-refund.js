// stripe.refund.js
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

    if (!body.chargeId) return badRequest('chargeId required');

    const { stripe } = await getStripe(org);
    const refund = await stripe.refunds.create({
      charge: body.chargeId,
      amount: typeof body.amount === 'number' ? body.amount : undefined
    });

    return json({ id: refund.id, status: refund.status || 'succeeded' });
  } catch (e) {
    return serverError(e);
  }
};
