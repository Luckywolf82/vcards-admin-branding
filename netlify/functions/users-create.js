// netlify/functions/users-create.js
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
})});

exports.handler = async (evt) => {
  if (evt.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const { email, password, displayName, disabled=false } = JSON.parse(evt.body || "{}");
    if (!email || !password) return { statusCode: 400, body: "Missing email/password" };
    const u = await admin.auth().createUser({ email, password, displayName, disabled });
    return { statusCode: 200, body: JSON.stringify({ ok:true, uid: u.uid }) };
  } catch (e) { return { statusCode: 500, body: JSON.stringify({ ok:false, error:e.message }) }; }
};
