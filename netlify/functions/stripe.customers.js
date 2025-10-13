// stripe.customers.js
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { getStripe } = require('./_lib/stripe');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const org = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';

    const { stripe } = await getStripe(org);

    if (event.httpMethod === 'GET') {
      const email = url.searchParams.get('email') || undefined;
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
      const res = await stripe.customers.list({ email, limit });
      const data = res.data.map(c => ({ id: c.id, email: c.email, name: c.name || null }));
      return json({ data, hasMore: res.has_more });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.email) return badRequest('email required');
      const c = await stripe.customers.create({
        email: body.email,
        name: body.name || undefined,
        phone: body.phone || undefined
      });
      return json({ id: c.id }, 201);
    }

    return badRequest('Use GET or POST');
  } catch (e) {
    return serverError(e);
  }
};

