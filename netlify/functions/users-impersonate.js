const { admin, requireRole, json, CORS_HEADERS } = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const actor = await requireRole(event, "superadmin");
    const body = JSON.parse(event.body || "{}");
    const uid = (body.uid || "").trim();

    if (!uid) {
      return json({ ok: false, error: "Missing uid" }, 400);
    }

    const target = await admin.auth().getUser(uid);
    const targetRole = (target.customClaims?.role || "viewer").toLowerCase();

    if (targetRole === "superadmin" && actor.uid !== uid) {
      return json({ ok: false, error: "Kan ikke impersonere annen superadmin" }, 403);
    }

    const customToken = await admin.auth().createCustomToken(uid, {
      impBy: actor.uid,
      impAt: Date.now(),
    });

    return json({ ok: true, uid, role: targetRole, customToken });
  } catch (err) {
    return json({ ok: false, error: err.message || "Internal error" }, err.statusCode || 500);
  }
};
