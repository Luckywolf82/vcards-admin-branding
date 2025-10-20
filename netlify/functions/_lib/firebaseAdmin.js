// _lib/firebaseAdmin.js
const firebaseAdmin = require('firebase-admin');

let app;
try {
  app = firebaseAdmin.app();
} catch {
  app = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // NB: Netlify env-vars lagrer ofte \n som bokstaver — konverter:
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth();
const FieldValue = firebaseAdmin.firestore.FieldValue;

module.exports = { admin: firebaseAdmin, db, auth, FieldValue };
