const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const RANK = { viewer: 1, support: 2, editor: 3, admin: 4, owner: 5, superadmin: 6 };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function requireAuth(evt) {
  const authz = (evt.headers?.authorization || evt.headers?.Authorization || "").trim();
  if (!authz || !/^Bearer\s+/.test(authz)) {
    throw httpError(401, "Missing Authorization Bearer token");
  }
  const idToken = authz.replace(/^Bearer\s+/i, "");
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (e) {
    throw httpError(401, "Invalid or expired token");
  }
}

async function requireRole(evt, minRole = "admin") {
  const user = await requireAuth(evt);
  const claimRole = user.role || user.customClaims?.role || "viewer";
  const userRank = RANK[claimRole] || RANK.viewer;
  const needRank = RANK[minRole] || RANK.admin;
  if (userRank < needRank) {
    throw httpError(403, `Forbidden: requires role >= ${minRole}`);
  }
  return user;
}

function httpError(status, message) {
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

function json(body, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

module.exports = { admin, requireAuth, requireRole, httpError, RANK, CORS_HEADERS, json };
