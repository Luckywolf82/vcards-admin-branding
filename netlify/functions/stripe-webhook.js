// stripe.webhook.js
// NB: Denne må være "raw" body. På Netlify: sett "body: 'raw'" via special handler config.
const { db } = require('./_lib/firebaseAdmin');
const { json, serverError } = require('./_lib/http');
const { getStripeConfig } = require('./_lib/stripe');
const Stripe = require('stripe');

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const org = (new URL(event.rawUrl)).searchParams.get('org') || 'Wayback';
    const cfg = await getStripeConfig(org);
    if (!cfg.webhookSecret || !process.env.STRIPE_SECRET_KEY) {
      console.warn('Missing webhook secret or secret key');
      return { statusCode: 200, body: 'noop' };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    // Verifiser signatur
    const payload = event.body; // rå streng
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    let evt;
    try {
      evt = stripe.webhooks.constructEvent(payload, sig, cfg.webhookSecret);
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed.', err.message);
      return { statusCode: 400, body: 'Invalid signature' };
    }

    // Håndter et par events
    if (evt.type === 'checkout.session.completed') {
      const s = evt.data.object;
      const orderId = s.metadata?.orderId || null;
      if (orderId) {
        await db.collection('orders').doc(orderId).set({
          status: 'new',
          stripe: {
            paymentIntent: s.payment_intent || null,
            customerId: s.customer || null
          },
          updatedAt: Date.now()
        }, { merge: true });
      }
    }

    if (evt.type === 'payment_intent.succeeded') {
      const pi = evt.data.object;
      const orderId = pi.metadata?.orderId || null;
      if (orderId) {
        await db.collection('orders').doc(orderId).set({
          status: 'new',
          stripe: {
            paymentIntent: pi.id,
            charge: (pi.latest_charge || null)
          },
          updatedAt: Date.now()
        }, { merge: true });
      }
    }

    // legg til flere cases ved behov (refund, failed, etc.)
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (e) {
    return serverError(e);
  }
};

// Netlify handler config – raw body
exports.config = {
  path: '/.netlify/functions/stripe-webhook',
  method: 'POST',
  body: 'raw' // viktig for Stripe-signatur
};
