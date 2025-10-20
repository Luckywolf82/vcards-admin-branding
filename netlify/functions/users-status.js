const { admin, requireRole, json, CORS_HEADERS } = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    await requireRole(event, "admin");
    const body = JSON.parse(event.body || "{}");
    const uid = (body.uid || "").trim();
    const status = (body.status || "").trim().toLowerCase();

    if (!uid || !["active", "disabled"].includes(status)) {
      return json({ ok: false, error: "Missing uid eller ugyldig status" }, 400);
    }

    const disabled = status === "disabled";
    await admin.auth().updateUser(uid, { disabled });

    return json({ ok: true, uid, status, disabled });
  } catch (err) {
    return json({ ok: false, error: err.message || "Internal error" }, err.statusCode || 500);
  }
};
