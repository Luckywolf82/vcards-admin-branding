// NFCKING: repo-vars start
const adminOwner = process.env.GITHUB_OWNER;
const adminRepo  = process.env.GITHUB_REPO;
const cardsOwner = process.env.CARDS_OWNER || adminOwner;
const cardsRepo  = process.env.CARDS_REPO  || "vcards";
const basePath   = process.env.BASE_PATH   || "Vcards";
console.log("[env] repos", { adminOwner, adminRepo, cardsOwner, cardsRepo, basePath });
// NFCKING: repo-vars end
// netlify/functions/users-invite.js
const admin = require("firebase-admin");

// âš ï¸ Viktig: IKKE require('nodemailer') i toppen.
// Vi importerer den dynamisk bare hvis SMTP-variabler finnes.
// const nodemailer = require("nodemailer"); // <-- fjernet

// Init Firebase Admin kun Ã©n gang
if (!admin.apps.length) admin.initializeApp();

// CORS
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

function json(body, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

// Enkel rolle-sjekk via ID-token custom claims
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
  if (!role || !["admin", "owner", "superadmin"].includes(role)) {
    const e = new Error("Forbidden: requires role >= admin");
    e.statusCode = 403;
    throw e;
  }
  return decoded;
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
      await admin.auth().updateUser(userRecord.uid, { displayName });
      userRecord = await admin.auth().getUser(userRecord.uid);
    }

    // Claims (rolle + orgKey)
    const prevClaims = userRecord.customClaims || {};
    const newClaims = {
      ...prevClaims,
      ...(role ? { role } : {}),
      ...(orgKey ? { orgKey } : {}),
    };
    const changed = JSON.stringify(prevClaims) !== JSON.stringify(newClaims);
    if (changed) {
      await admin.auth().setCustomUserClaims(userRecord.uid, newClaims);
    }

    // Lag passordlÃ¸s sign-in link (krever â€œEmail link (passwordless)â€ aktivert i Firebase)
    const continueUrl =
      process.env.INVITE_CONTINUE_URL || "https://nfcking.netlify.app/index.html";
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
      // dynamicLinkDomain: process.env.INVITE_DYNAMIC_LINK || undefined,
    };

    let inviteLink;
    if (typeof admin.auth().generateSignInWithEmailLink === "function") {
      inviteLink = await admin.auth().generateSignInWithEmailLink(
        email,
        actionCodeSettings
      );
    } else {
      // Eldre Admin SDK â€“ gi tydelig beskjed, men ikke fail hardt
      return json({
        ok: true,
        uid: userRecord.uid,
        emailSent: false,
        inviteLink: null,
        note:
          "Admin SDK mangler generateSignInWithEmailLink(). Oppgrader firebase-admin eller bruk klient-SDK for Ã¥ sende e-postlenke.",
      });
    }

    // E-post: send kun hvis SMTP-variabler finnes. Dynamisk import av nodemailer.
    let emailSent = false;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
      let nodemailer;
      try {
        // Dynamisk import for Ã¥ unngÃ¥ hard bundling nÃ¥r pakken ikke er installert
        nodemailer = await import("nodemailer").then((m) => m.default || m);
      } catch (e) {
        // Hvis ikke installert, returnÃ©r lenke men informer om at e-post ikke ble sendt
        return json({
          ok: true,
          uid: userRecord.uid,
          role: newClaims.role || null,
          orgKey: newClaims.orgKey || null,
          inviteLink,
          emailSent: false,
          note:
            "SMTP konfigurert, men 'nodemailer' er ikke installert. Legg til 'nodemailer' i package.json for Ã¥ sende e-post.",
        });
      }

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      const html = `
        <p>Hei${displayName ? " " + displayName : ""}!</p>
        <p>Du er invitert til NFCKING. Klikk lenken under for Ã¥ logge inn:</p>
        <p><a href="${inviteLink}">FullfÃ¸r innlogging</a></p>
        <p>Hvis knappen ikke virker, kopier denne URLen inn i nettleseren:</p>
        <p style="word-break:break-all">${inviteLink}</p>
      `;

      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "NFCKING â€“ invitasjon",
        html,
      });
      emailSent = true;
    }

    // Alltid returnÃ©r inviteLink, sÃ¥ du kan sende den manuelt ved behov
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



