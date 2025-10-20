const { admin, requireRole, json, CORS_HEADERS } = require("./_lib/auth");

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
    const requestedRole = normaliseRole(roles[0] || body.role);
    const orgKey = body.orgKey === undefined ? undefined : (body.orgKey || "").trim();

    if (!uid) {
      return json({ ok: false, error: "Missing uid" }, 400);
    }

    if (["owner", "superadmin"].includes(requestedRole) && actorRole !== "superadmin") {
      return json({ ok: false, error: "Only superadmin can assign owner/superadmin" }, 403);
    }

    if (requestedRole === "admin" && !["owner", "superadmin"].includes(actorRole)) {
      return json({ ok: false, error: "Only owner eller superadmin kan tildele admin" }, 403);
    }

    const user = await admin.auth().getUser(uid);
    const prevClaims = user.customClaims || {};
    const nextClaims = { ...prevClaims, role: requestedRole };

    if (orgKey !== undefined) {
      if (orgKey) {
        nextClaims.orgKey = orgKey;
      } else {
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
    });
  } catch (err) {
    return json({ ok: false, error: err.message || "Internal error" }, err.statusCode || 500);
  }
};
