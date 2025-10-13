// orders.invoice.js
// Genererer kun metadata + "falsk" PDF-url. Bytt ut med ekte PDF-render (f.eks. pdfkit) senere.
const { db } = require('./_lib/firebaseAdmin');
const { json, badRequest, serverError } = require('./_lib/http');
const { requireRole } = require('./_lib/authz');

exports.handler = async (event) => {
  try {
    const guard = await requireRole(event, ['admin','superadmin']); if (guard.error) return guard.error;
    if (event.httpMethod !== 'POST') return badRequest('POST only');
    const body = JSON.parse(event.body || '{}');

    const id = (body.id || '').trim();
    const number = body.number || `INV-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    if (!id) return badRequest('id required');

    const pdfUrl = `/media/invoices/${number}.pdf`; // TODO: faktisk generering + opplasting
    const inv = {
      orderId: id,
      pdfUrl, number,
      issuedAt: Date.now()
    };
    const ref = await db.collection('invoices').add(inv);
    await db.collection('orders').doc(id).set({ invoiceId: ref.id }, { merge: true });
    return json({ invoiceId: ref.id, pdfUrl });
  } catch (e) {
    return serverError(e);
  }
};
