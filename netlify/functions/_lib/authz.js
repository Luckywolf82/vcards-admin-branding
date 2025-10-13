// _lib/authz.js
// Verifiser Firebase ID-token fra Authorization: Bearer <token>
// Sjekk roller / orgKey fra custom claims
const { auth } = require('./firebaseAdmin');
const { unauthorized, forbidden } = require('./http');

async function getUserFromEvent(event) {
  try {
    const hdr = event.headers.authorization || event.headers.Authorization || '';
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) return { error: unauthorized() };
    const token = m[1];
    const decoded = await auth.verifyIdToken(token, true);
    return { uid: decoded.uid, claims: decoded };
  } catch (e) {
    console.warn('verifyIdToken failed', e);
    return { error: unauthorized() };
  }
}

/**
 * RBAC-guard. Eksempel:
 *   const guard = await requireRole(event, ['admin','superadmin']);
 *   if (guard.error) return guard.error;
 *   const { uid, claims } = guard;
 */
async function requireRole(event, roles = []) {
  const u = await getUserFromEvent(event);
  if (u.error) return u;
  const userRoles = new Set(u.claims.roles || []);
  const allowed = roles.some(r => userRoles.has(r));
  if (!allowed) return { error: forbidden() };
  return u;
}

module.exports = { getUserFromEvent, requireRole };
