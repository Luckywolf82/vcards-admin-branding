// netlify/functions/users-invite.js
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Del init: gjenbruk Admin-app hvis finnes
if (!admin.apps.length) admin.initializeApp();

// CORS headers
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

// Rolle-sjekk (enkel – basert på custom claims i ID-token)
async function requireAdmin(event) {
  const authz =
    (event.headers?.authorization || event.headers?.Authorization || "").trim();
  if (!authz.startsWith("Bearer ")) {
    const e = new Error("Missing Authorization Bearer token");
    e.statusCode = 401;
    throw e;
  }
  const token = authz.replace(/^Bearer\s+/i, "");
  const decoded = await admin.auth().verifyIdToken(token);
  const role = (decoded.role || decoded.customClaims?.role || "").toLowerCase();
  if (!role || !["admin", "owner"].includes(role)) {
    const e = new Error("Forbidden: requires role >= admin");
    e.statusCode = 403;
    throw e;
  }
  return decoded;
}

function json(body, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    await requireAdmin(event);

    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim().toLowerCase();
    const displayName = (body.displayName || "").trim();
    const role = (body.role || "viewer").trim().toLowerCase();
    const orgKey = (body.orgKey || "").trim();

    if (!email) return json({ ok: false, error: "Missing email" }, 400);

    // Finn/lag bruker
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      userRecord = null;
    }
    if (!userRecord) {
      userRecord = await admin.auth().createUser({
        email,
        emailVerified: false,
        displayName: displayName || undefined,
        disabled: false,
      });
    } else if (displayName && userRecord.displayName !== displayName) {
      // Oppdater navn hvis oppgitt
      await admin.auth().updateUser(userRecord.uid, { displayName });
      userRecord = await admin.auth().getUser(userRecord.uid);
    }

    // Sett/merg claims (rolle + orgKey)
    const prevClaims = userRecord.customClaims || {};
    const newClaims = {
      ...prevClaims,
      ...(role ? { role } : {}),
      ...(orgKey ? { orgKey } : {}),
    };
    const changed =
      JSON.stringify(prevClaims) !== JSON.stringify(newClaims);
    if (changed) {
      await admin.auth().setCustomUserClaims(userRecord.uid, newClaims);
    }

    // Generér sign-in link (krever at "Email link (passwordless)" er aktiv i Firebase)
    const continueUrl =
      process.env.INVITE_CONTINUE_URL ||
      "https://nfcking.netlify.app/index.html";
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
      // optional:
      // dynamicLinkDomain: process.env.INVITE_DYNAMIC_LINK || undefined,
    };

    // NB: Admin SDK har generateSignInWithEmailLink i nyere versjoner.
    let inviteLink;
    if (typeof admin.auth().generateSignInWithEmailLink === "function") {
      inviteLink = await admin.auth().generateSignInWithEmailLink(
        email,
        actionCodeSettings
      );
    } else {
      // Fallback: gi en tydelig feilmelding om Admin SDK er for gammel
      return json({
        ok: true,
        uid: userRecord.uid,
        emailSent: false,
        inviteLink: null,
        note:
          "Admin SDK mangler generateSignInWithEmailLink(). Oppgrader firebase-admin eller bruk klient-SDK for å sende e-postlenke.",
      });
    }

    // Send e-post hvis SMTP-variabler finnes
    let emailSent = false;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } =
      process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      const html = `
        <p>Hei${displayName ? " " + displayName : ""}!</p>
        <p>Du er invitert til NFCKING. Klikk lenken under for å logge inn:</p>
        <p><a href="${inviteLink}">Fullfør innlogging</a></p>
        <p>Hvis knappen ikke virker, kopier denne URLen inn i nettleseren:</p>
        <p style="word-break:break-all">${inviteLink}</p>
      `;

      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "NFCKING – invitasjon",
        html,
      });
      emailSent = true;
    }

    return json({
      ok: true,
      uid: userRecord.uid,
      role: newClaims.role || null,
      orgKey: newClaims.orgKey || null,
      inviteLink,
      emailSent,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return json({ ok: false, error: err.message || String(err) }, status);
  }
};
