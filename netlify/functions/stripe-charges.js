// stripe.charges.js
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { getStripe } = require('./_lib/stripe');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const org = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';
    const status = url.searchParams.get('status') || ''; // 'succeeded' | 'pending' | 'failed' osv.
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
    const fromISO = url.searchParams.get('from');
    const toISO   = url.searchParams.get('to');

    const created = {};
    if (fromISO) created.gte = Math.floor(new Date(fromISO).getTime() / 1000);
    if (toISO)   created.lte = Math.floor(new Date(toISO).getTime() / 1000);

    const { stripe } = await getStripe(org);
    const res = await stripe.charges.list({
      limit,
      ...(status ? { status } : {}),
      ...(Object.keys(created).length ? { created } : {})
    });

    const data = res.data.map(c => ({
      id: c.id,
      created: new Date(c.created * 1000).toISOString(),
      amount: c.amount,
      currency: c.currency.toUpperCase(),
      status: c.status,
      customer: { id: c.customer?.id || c.customer || null, email: c.billing_details?.email || null },
      payment_intent: typeof c.payment_intent === 'string' ? c.payment_intent : (c.payment_intent?.id || null),
    }));

    return json({ data, hasMore: res.has_more });
  } catch (e) {
    return serverError(e);
  }
};
