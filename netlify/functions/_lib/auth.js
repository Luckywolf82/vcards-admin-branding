const admin = require("firebase-admin");

// Init Firebase Admin (deles av alle functions)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

// Rolle-hierarki: høyere tall = mer privilegier
const RANK = { viewer: 1, support: 2, editor: 3, admin: 4, owner: 5 };

// Hent og verifiser ID-token fra Authorization-header
async function requireAuth(evt) {
  const authz = (evt.headers?.authorization || evt.headers?.Authorization || "").trim();
  if (!authz || !/^Bearer\s+/.test(authz)) {
    throw httpError(401, "Missing Authorization Bearer token");
  }
  const idToken = authz.replace(/^Bearer\s+/i, "");
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded; // { uid, email, role?, ... }
  } catch (e) {
    throw httpError(401, "Invalid or expired token");
  }
}

// Sjekk at bruker har minst gitt rolle
async function requireRole(evt, minRole = "admin") {
  const user = await requireAuth(evt);
  const userRank = RANK[(user.role || "viewer")] || RANK.viewer;
  const needRank = RANK[minRole] || RANK.admin;
  if (userRank < needRank) {
    throw httpError(403, `Forbidden: requires role >= ${minRole}`);
  }
  return user;
}

// Enkel http-feil
function httpError(status, message) {
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

module.exports = { admin, requireAuth, requireRole, httpError, RANK };
