const {
  admin,
  requireRole,
  json,
  CORS_HEADERS,
  SUPERADMIN_EMAILS,
  collectOrgSet,
} = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "GET") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const actor = await requireRole(event, "admin");
    const actorRole = (actor.role || actor.customClaims?.role || "").toLowerCase();
    const actorOrgSet = new Set(Array.isArray(actor.orgs) ? actor.orgs : collectOrgSet(actor));
    const actorIsSuper = actorRole === "superadmin";

    const params = event.queryStringParameters || {};
    const q = (params.q || "").trim().toLowerCase();
    const wantRole = (params.role || "").trim().toLowerCase();
    const wantStatus = (params.status || "").trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(params.limit, 10) || 50, 1), 1000);
    const pageToken = (params.pageToken || "").trim() || undefined;

    const listed = await admin.auth().listUsers(limit, pageToken);
    let users = listed.users.map((u) => {
      const claims = u.customClaims || {};
      let role = (claims.role || "").toLowerCase() || null;
      const email = (u.email || "").toLowerCase();
      if (email && SUPERADMIN_EMAILS.has(email)) {
        role = "superadmin";
      }
      const userOrgSet = collectOrgSet(claims);
      return {
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || null,
        disabled: !!u.disabled,
        role,
        orgKey: claims.orgKey || null,
        orgs: Array.from(userOrgSet),
        createdAt: u.metadata?.creationTime || null,
        status: u.disabled ? "disabled" : "active",
      };
    });

    if (!actorIsSuper) {
      const filterSet = actorOrgSet.size ? actorOrgSet : collectOrgSet(actor);
      const orgs = new Set(filterSet);
      users = users.filter((u) => {
        if (u.uid === actor.uid) return true;
        if (!orgs.size) return false;
        const userOrgs = new Set(u.orgs || (u.orgKey ? [u.orgKey] : []));
        if (!userOrgs.size) return false;
        for (const key of userOrgs) {
          if (orgs.has(key)) return true;
        }
        return false;
      });
    }

    if (q) {
      users = users.filter((u) => {
        const name = (u.displayName || "").toLowerCase();
        const mail = (u.email || "").toLowerCase();
        return name.includes(q) || mail.includes(q);
      });
    }

    if (wantRole) {
      users = users.filter((u) => (u.role || "") === wantRole);
    }

    if (wantStatus === "active" || wantStatus === "disabled") {
      users = users.filter((u) => u.status === wantStatus);
    }

    return json({
      ok: true,
      count: users.length,
      users,
      nextPageToken: listed.pageToken || null,
    });
  } catch (err) {
    return json({ ok: false, error: err.message || "Internal error" }, err.statusCode || 500);
  }
};
