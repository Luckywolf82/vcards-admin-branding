// netlify/functions/users-invite.js
const { admin, requireRole, httpError } = require("./_lib/auth");

// CORS helper (enkelt, nok for Netlify)
function corsify(res) {
  const h = res.headers || (res.headers = {});
  h["Access-Control-Allow-Origin"] = "*";
  h["Access-Control-Allow-Headers"] = "authorization, content-type";
  h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  return res;
}

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return corsify({ statusCode: 204, body: "" });
  }

  try {
    // Krever admin (owner > admin går også gjennom pga. RANK)
    await requireRole(event, "admin");

    if (event.httpMethod !== "POST") {
      throw httpError(405, "Only POST supported");
    }

    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim().toLowerCase();
    const displayName = (body.displayName || "").trim();
    const role = (body.role || "viewer").trim();

    if (!email) throw httpError(400, "Mangler e-postadresse");

    // 1) Opprett bruker dersom den ikke finnes
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      userRecord = await admin.auth().createUser({
        email,
        displayName,
        emailVerified: false,
        disabled: false,
      });
    }

    // 2) Sett/oppdater custom claims (rolle)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // 3) Generer magic sign-in link (e-post link)
    //    NB: dette sender IKKE epost; vi returnerer lenken, så frontenden kan vise/kopiere.
    const continueUrl =
      process.env.INVITE_CONTINUE_URL ||
      "https://nfcking.netlify.app/index.html";

    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };

    // Admin SDK har generateSignInWithEmailLink
    const link = await admin
      .auth()
      .generateSignInWithEmailLink(email, actionCodeSettings);

    // Ferdig
    return corsify({
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        uid: userRecord.uid,
        email,
        role,
        emailSent: false,      // ingen utsending her (krever ekstern SMTP/SendGrid)
        inviteLink: link,      // vises i UI for kopiering
      }),
    });
  } catch (err) {
    console.error("users-invite error:", err);
    return corsify({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ ok: false, error: err.message || "Ukjent feil" }),
    });
  }
};
