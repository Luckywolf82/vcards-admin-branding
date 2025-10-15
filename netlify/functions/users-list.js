const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

exports.handler = async (event) => {
  try {
    const { q, role, status, limit, pageToken } = event.queryStringParameters || {};

    const maxResults = parseInt(limit) || 100;
    const listOpts = { maxResults };
    if (pageToken) listOpts.pageToken = pageToken;

    const res = await admin.auth().listUsers(maxResults, pageToken || undefined);
    let users = res.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      disabled: u.disabled,
      customClaims: u.customClaims || {},
      metadata: u.metadata
    }));

    // Tekstsøk i epost/navn
    if (q) {
      const qLow = q.toLowerCase();
      users = users.filter(u =>
        (u.email && u.email.toLowerCase().includes(qLow)) ||
        (u.displayName && u.displayName.toLowerCase().includes(qLow))
      );
    }

    // Filtrer på rolle
    if (role) {
      users = users.filter(u => (u.customClaims.role || '').toLowerCase() === role.toLowerCase());
    }

    // Filtrer på status
    if (status) {
      const wantActive = status.toLowerCase() === "active";
      users = users.filter(u => !u.disabled === wantActive);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        count: users.length,
        nextPageToken: res.pageToken || null,
        users
      }),
    };
  } catch (err) {
    console.error("users-list error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message || String(err) }),
    };
  }
};
