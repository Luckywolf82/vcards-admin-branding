const firebaseAdmin = require("firebase-admin");

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const RANK = { viewer: 1, support: 2, editor: 3, admin: 4, owner: 5, superadmin: 6 };

const DEFAULT_SUPERADMINS = ["trygve.waagen@gmail.com"];
const SUPERADMIN_EMAILS = new Set(
  (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);
DEFAULT_SUPERADMINS.forEach((email) => SUPERADMIN_EMAILS.add(email.toLowerCase()));

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function normaliseOrgKey(value) {
  if (Array.isArray(value)) {
    const set = new Set();
    value.forEach((entry) => {
      const clean = normaliseOrgKey(entry);
      if (clean) set.add(clean);
    });
    return Array.from(set);
  }

  if (!value && value !== 0) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function collectOrgSet(claims = {}) {
  const set = new Set();
  const add = (input) => {
    if (Array.isArray(input)) {
      input.forEach((entry) => add(entry));
      return;
    }
    if (typeof input === "string") {
      input
        .split(/[,\s]+/)
        .map((part) => normaliseOrgKey(part))
        .filter(Boolean)
        .forEach((key) => set.add(key));
      return;
    }
    const clean = normaliseOrgKey(input);
    if (clean) set.add(clean);
  };

  add(claims.orgs);
  add(claims.orgKeys);
  add(claims.orgAccess);
  add(claims.allowedOrgs);
  add(claims.orgKey);
  add(claims.org);

  return set;
}

function applyOrgClaims(decoded) {
  const set = collectOrgSet(decoded);
  decoded.orgs = Array.from(set);
  if (!decoded.orgKey && decoded.orgs.length) {
    decoded.orgKey = decoded.orgs[0];
  }
  decoded.orgsAll = decoded.role === "superadmin";
  decoded.allowedOrgs = decoded.orgs.slice();
  return set;
}

async function requireAuth(evt) {
  const authz = (evt.headers?.authorization || evt.headers?.Authorization || "").trim();
  if (!authz || !/^Bearer\s+/.test(authz)) {
    throw httpError(401, "Missing Authorization Bearer token");
  }
  const idToken = authz.replace(/^Bearer\s+/i, "");
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    const email = (decoded.email || "").toLowerCase();
    if (email && SUPERADMIN_EMAILS.has(email)) {
      decoded.role = "superadmin";
    }
    applyOrgClaims(decoded);
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
  if (!user.orgs || !Array.isArray(user.orgs)) {
    applyOrgClaims(user);
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

module.exports = {
  admin: firebaseAdmin,
  requireAuth,
  requireRole,
  httpError,
  RANK,
  CORS_HEADERS,
  json,
  SUPERADMIN_EMAILS,
  normaliseOrgKey,
  collectOrgSet,
};
