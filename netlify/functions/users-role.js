const {
  admin,
  requireRole,
  json,
  CORS_HEADERS,
  normaliseOrgKey,
} = require("./_lib/auth");

function parseOrgKeys(body = {}) {
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

  if (body.orgs !== undefined) add(body.orgs);
  if (body.orgKeys !== undefined) add(body.orgKeys);
  if (body.orgAccess !== undefined) add(body.orgAccess);
  if (body.orgKey !== undefined) add(body.orgKey);
  if (body.org !== undefined) add(body.org);

  return Array.from(set);
}

function normaliseRole(role) {
  const allowed = ["viewer", "support", "editor", "admin", "owner", "superadmin"];
  const clean = (role || "viewer").toLowerCase();
  return allowed.includes(clean) ? clean : "viewer";
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const actor = await requireRole(event, "owner");
    const actorRole = (actor.role || actor.customClaims?.role || "").toLowerCase();

    const body = JSON.parse(event.body || "{}");
    const uid = (body.uid || "").trim();
    const roles = Array.isArray(body.roles) ? body.roles : [];
    const hasRoleInput = roles.length > 0 || body.role !== undefined;
    const requestedRoleRaw = hasRoleInput ? (roles[0] || body.role) : undefined;
    const targetOrgsProvided =
      body.orgs !== undefined ||
      body.orgKeys !== undefined ||
      body.orgAccess !== undefined ||
      body.orgKey !== undefined ||
      body.org !== undefined;
    const parsedOrgs = targetOrgsProvided ? parseOrgKeys(body) : undefined;
    const primaryOrg = parsedOrgs && parsedOrgs.length ? parsedOrgs[0] : null;

    if (!uid) {
      return json({ ok: false, error: "Missing uid" }, 400);
    }

    const user = await admin.auth().getUser(uid);
    const prevClaims = user.customClaims || {};
    const currentRole = normaliseRole(prevClaims.role);
    const requestedRole = hasRoleInput ? normaliseRole(requestedRoleRaw) : currentRole;

    if (["owner", "superadmin"].includes(requestedRole) && actorRole !== "superadmin") {
      return json({ ok: false, error: "Only superadmin can assign owner/superadmin" }, 403);
    }

    if (requestedRole === "admin" && !["owner", "superadmin"].includes(actorRole)) {
      return json({ ok: false, error: "Only owner eller superadmin kan tildele admin" }, 403);
    }

    if (targetOrgsProvided && actorRole !== "superadmin" && parsedOrgs) {
      const actorOrgs = new Set(Array.isArray(actor.orgs) ? actor.orgs : []);
      if (!actorOrgs.size && parsedOrgs.length) {
        return json({ ok: false, error: "Du har ikke tilgang til disse organisasjonene" }, 403);
      }
      const denied = parsedOrgs.filter((key) => !actorOrgs.has(key));
      if (denied.length) {
        return json({ ok: false, error: `Ingen tilgang til: ${denied.join(", ")}` }, 403);
      }
    }

    const nextClaims = { ...prevClaims };
    nextClaims.role = requestedRole;

    if (targetOrgsProvided) {
      if (parsedOrgs && parsedOrgs.length) {
        nextClaims.orgs = parsedOrgs;
        nextClaims.orgKey = primaryOrg;
      } else {
        delete nextClaims.orgs;
        delete nextClaims.orgKey;
      }
    }

    if (JSON.stringify(prevClaims) !== JSON.stringify(nextClaims)) {
      await admin.auth().setCustomUserClaims(uid, nextClaims);
    }

    return json({
      ok: true,
      uid,
      role: requestedRole,
      orgKey: nextClaims.orgKey || null,
      orgs: Array.isArray(nextClaims.orgs) ? nextClaims.orgs : [],
    });
  } catch (err) {
    return json({ ok: false, error: err.message || "Internal error" }, err.statusCode || 500);
  }
};
