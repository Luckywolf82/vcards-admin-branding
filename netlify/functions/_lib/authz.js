// _lib/authz.js
// Verifiser Firebase ID-token fra Authorization: Bearer <token>
// Sjekk roller / orgKey fra custom claims
const { auth } = require('./firebaseAdmin');
const { unauthorized, forbidden } = require('./http');
const { SUPERADMIN_EMAILS } = require('./auth');

function collectRoles(claims = {}) {
  const roles = new Set();
  const list = Array.isArray(claims.roles) ? claims.roles : [];
  list.forEach((role) => {
    const value = String(role || '').toLowerCase();
    if (value) roles.add(value);
  });

  const single = String(claims.role || '').toLowerCase();
  if (single) roles.add(single);

  const email = String(claims.email || '').toLowerCase();
  if (email && SUPERADMIN_EMAILS && SUPERADMIN_EMAILS.has(email)) {
    roles.add('superadmin');
  }

  if (roles.size === 0) {
    roles.add('viewer');
  }

  return roles;
}

async function getUserFromEvent(event) {
  try {
    const hdr = event.headers.authorization || event.headers.Authorization || '';
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) return { error: unauthorized() };
    const token = m[1];
    const decoded = await auth.verifyIdToken(token, true);
    const roles = collectRoles(decoded);
    decoded.roles = Array.from(roles);
    if (roles.has('superadmin')) {
      decoded.role = 'superadmin';
    } else if (!decoded.role && decoded.roles.length) {
      decoded.role = decoded.roles[0];
    }
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
  const guard = await getUserFromEvent(event);
  if (guard.error) return guard;

  const required = Array.isArray(roles) ? roles : [roles];
  const userRoles = collectRoles(guard.claims);
  const allowed = required.length === 0
    || required.some((role) => userRoles.has(String(role || '').toLowerCase()));

  if (!allowed) {
    return { error: forbidden() };
  }

  guard.claims.roles = Array.from(userRoles);
  if (userRoles.has('superadmin')) {
    guard.claims.role = 'superadmin';
  } else if (!guard.claims.role && guard.claims.roles.length) {
    guard.claims.role = guard.claims.roles[0];
  }

  return guard;
}

module.exports = { getUserFromEvent, requireRole };
