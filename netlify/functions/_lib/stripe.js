// _lib/stripe.js
// Velger Stripe-key fra Firestore (stripe_config/{orgKey}) eller ENV fallback.
// Husk å sette STRIPE_SECRET_KEY/STRIPE_PUBLISHABLE_KEY i Netlify env for fallback.
const { db } = require('./firebaseAdmin');
const Stripe = require('stripe');

async function getStripeConfig(orgKey) {
  // prøv Firestore doc
  if (orgKey) {
    const doc = await db.collection('stripe_config').doc(orgKey).get();
    if (doc.exists) {
      const d = doc.data() || {};
      // Ikke returner hemmeligheter til klient – bruk kun server-side her
      return {
        mode: d.mode || process.env.STRIPE_MODE || 'test',
        // NB: secretKey og webhookSecret antas lagret i ENV i prod,
        // men du kan speile kryptert i Firestore og dekryptere her.
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: d.pubKey || process.env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
        connect: d.connect || { enabled: false }
      };
    }
  }
  // fallback ENV
  return {
    mode: process.env.STRIPE_MODE || 'test',
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
    connect: { enabled: false }
  };
}

async function getStripe(orgKey) {
  const cfg = await getStripeConfig(orgKey);
  if (!cfg.secretKey) throw new Error('Missing STRIPE_SECRET_KEY');
  const stripe = new Stripe(cfg.secretKey, { apiVersion: '2024-06-20' });
  return { stripe, cfg };
}

module.exports = { getStripe, getStripeConfig };
