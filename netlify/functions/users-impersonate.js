// netlify/functions/users-impersonate.js
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
})});

exports.handler = async (evt) => {
  if (evt.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const { uid } = JSON.parse(evt.body || "{}");
    if (!uid) return { statusCode: 400, body: "Missing uid" };
    const token = await admin.auth().createCustomToken(uid, { impersonated:true });
    return { statusCode: 200, body: JSON.stringify({ ok:true, token }) };
  } catch (e) { return { statusCode: 500, body: JSON.stringify({ ok:false, error:e.message }) }; }
};
