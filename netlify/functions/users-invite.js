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

  add(body.orgs);
  add(body.orgKeys);
  add(body.orgAccess);
  add(body.orgKey);
  add(body.org);

  return Array.from(set);
}

async function upsertUser(email, displayName) {
  let record;
  try {
    record = await admin.auth().getUserByEmail(email);
    if (displayName && record.displayName !== displayName) {
      await admin.auth().updateUser(record.uid, { displayName });
      record = await admin.auth().getUser(record.uid);
    }
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      record = await admin.auth().createUser({
        email,
        emailVerified: false,
        displayName: displayName || undefined,
        disabled: false,
      });
    } else {
      throw err;
    }
  }
  return record;
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
    const actor = await requireRole(event, "admin");
    const actorRole = (actor.role || actor.customClaims?.role || "").toLowerCase();
    const actorOrgs = new Set(Array.isArray(actor.orgs) ? actor.orgs : []);

    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim().toLowerCase();
    const displayName = (body.displayName || "").trim();
    const role = normaliseRole(body.role);
    const orgs = parseOrgKeys(body);
    const primaryOrg = orgs[0] || null;

    if (actorRole !== "superadmin" && orgs.length) {
      if (!actorOrgs.size) {
        return json({ ok: false, error: "Du har ikke tilgang til disse organisasjonene" }, 403);
      }
      const denied = orgs.filter((key) => !actorOrgs.has(key));
      if (denied.length) {
        return json({ ok: false, error: `Ingen tilgang til: ${denied.join(", ")}` }, 403);
      }
    }

    if (!email) {
      return json({ ok: false, error: "Missing email" }, 400);
    }

    const user = await upsertUser(email, displayName);
    const prevClaims = user.customClaims || {};
    const nextClaims = { ...prevClaims };
    nextClaims.role = role;
    if (orgs.length) {
      nextClaims.orgs = orgs;
      nextClaims.orgKey = primaryOrg;
    } else {
      delete nextClaims.orgs;
      delete nextClaims.orgKey;
    }

    if (JSON.stringify(prevClaims) !== JSON.stringify(nextClaims)) {
      await admin.auth().setCustomUserClaims(user.uid, nextClaims);
    }

    // Lag passordlÃ¸s sign-in link (krever â€œEmail link (passwordless)â€ aktivert i Firebase)
    const continueUrl =
      process.env.INVITE_CONTINUE_URL || "https://nfcking.netlify.app/index.html";

    let inviteLink = null;
    if (typeof admin.auth().generateSignInWithEmailLink === "function") {
      inviteLink = await admin.auth().generateSignInWithEmailLink(email, {
        url: continueUrl,
        handleCodeInApp: true,
      });
    } else {
      // Eldre Admin SDK â€“ gi tydelig beskjed, men ikke fail hardt
      return json({
        ok: true,
        uid: user.uid,
        role,
        orgKey: primaryOrg,
        orgs,
        inviteLink: null,
        emailSent: false,
        note:
          "Admin SDK mangler generateSignInWithEmailLink(). Oppgrader firebase-admin eller bruk klient-SDK for Ã¥ sende e-postlenke.",
      });
    }

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
        emailSent = true;
      } else {
        note =
          "SMTP er ikke konfigurert. Lenken vises her slik at du kan sende invitasjonen manuelt.";
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
      uid: user.uid,
      role,
      orgKey: primaryOrg,
      orgs,
      inviteLink,
      emailSent,
    };
    if (note) {
      response.note = note;
    }
    return json(response);
  } catch (err) {
    return json({ ok: false, error: err.message || "Internal error" }, err.statusCode || 500);
  }
};



