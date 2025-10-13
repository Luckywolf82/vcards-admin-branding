// stripe.products.js
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');
const { getStripe } = require('./_lib/stripe');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']);
    if (guard.error) return guard.error;

    const url = new URL(event.rawUrl);
    const org = url.searchParams.get('org') || guard.claims.orgKey || 'Wayback';

    if (event.httpMethod === 'GET') {
      const active = url.searchParams.get('active');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
      const { stripe } = await getStripe(org);

      const res = await stripe.products.list({
        limit,
        ...(active ? { active: active === 'true' } : {})
      });

      // hent priser pr. produkt
      const products = [];
      for (const p of res.data) {
        const prices = await stripe.prices.list({ product: p.id, limit: 50 });
        products.push({
          id: p.id,
          name: p.name,
          active: p.active,
          images: p.images || [],
          prices: prices.data.map(pr => ({
            id: pr.id,
            currency: pr.currency,
            unit_amount: pr.unit_amount,
            type: pr.type,
            recurring: pr.recurring || null,
            active: pr.active
          }))
        });
      }
      return json({ data: products, hasMore: res.has_more });
    }

    if (event.httpMethod === 'POST') {
      const { stripe } = await getStripe(org);
      const body = JSON.parse(event.body || '{}');
      if (!body.name) return badRequest('name required');

      const product = await stripe.products.create({
        name: body.name,
        description: body.description || '',
        active: typeof body.active === 'boolean' ? body.active : true,
        images: Array.isArray(body.images) ? body.images : []
      });

      const createdPrices = [];
      if (Array.isArray(body.prices)) {
        for (const pr of body.prices) {
          const price = await stripe.prices.create({
            product: product.id,
            currency: pr.currency || 'nok',
            unit_amount: pr.unit_amount,
            ...(pr.type === 'recurring'
              ? { recurring: { interval: (pr.interval || 'month') } }
              : {}),
            active: typeof pr.active === 'boolean' ? pr.active : true
          });
          createdPrices.push({ id: price.id });
        }
      }

      return json({ id: product.id, prices: createdPrices }, 201);
    }

    return badRequest('Use GET or POST');
  } catch (e) {
    return serverError(e);
  }
};
