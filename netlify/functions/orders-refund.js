// orders.refund.js
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { getStripe } = require('./_lib/stripe');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');

    const body = JSON.parse(event.body || '{}');
    const id = (body.id || '').trim();
    if (!id) return badRequest('id required');

    const ord = await db.collection('orders').doc(id).get();
    if (!ord.exists) return badRequest('order not found');
    const chargeId = body.chargeId || ord.data().stripe?.charge;
    if (!chargeId) return badRequest('chargeId missing');

    const org = ord.data().orgKey || guard.claims.orgKey || 'Wayback';
    const { stripe } = await getStripe(org);
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: typeof body.amount === 'number' ? body.amount : undefined,
      reason: body.reason || undefined
    });

    await db.collection('orders').doc(id).set({ status: 'refunded', updatedAt: Date.now() }, { merge: true });
    return json({ refundId: refund.id, status: refund.status || 'succeeded' });
  } catch (e) {
    return serverError(e);
  }
};
