const {
  admin,
  requireRole,
  json,
  CORS_HEADERS,
  normaliseOrgKey,
} = require("./_lib/auth");
const { loadSmtpConfig, sendSmtpMail } = require("./_lib/settings");

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

    const continueUrl =
      process.env.INVITE_CONTINUE_URL || "https://nfcking.netlify.app/index.html";

    let inviteLink = null;
    if (typeof admin.auth().generateSignInWithEmailLink === "function") {
      inviteLink = await admin.auth().generateSignInWithEmailLink(email, {
        url: continueUrl,
        handleCodeInApp: true,
      });
    } else {
      return json({
        ok: true,
        uid: user.uid,
        role,
        orgKey: primaryOrg,
        orgs,
        inviteLink: null,
        emailSent: false,
        note:
          "firebase-admin mangler generateSignInWithEmailLink(). Oppgrader SDK eller send lenke fra klient.",
      });
    }

    let emailSent = false;
    let note = null;
    try {
      const smtpConfig = await loadSmtpConfig();
      if (smtpConfig) {
        await sendSmtpMail(smtpConfig, {
          to: email,
          subject: "NFCKING – invitasjon",
          text: [
            `Hei${displayName ? ` ${displayName}` : ""}!`,
            "",
            "Du er invitert til NFCKING administrasjon. Åpne lenken for å logge inn:",
            inviteLink,
          ].join("\n"),
          html: `
            <p>Hei${displayName ? ` ${displayName}` : ""}!</p>
            <p>Du er invitert til NFCKING administrasjon. Klikk lenken under for å logge inn:</p>
            <p><a href="${inviteLink}">Fullfør innlogging</a></p>
            <p>Hvis knappen ikke fungerer, kopier denne URLen inn i nettleseren:</p>
            <p style="word-break:break-all">${inviteLink}</p>
          `,
        });
        emailSent = true;
      } else {
        note =
          "SMTP er ikke konfigurert. Lenken vises her slik at du kan sende invitasjonen manuelt.";
      }
    } catch (err) {
      note = `E-post kunne ikke sendes automatisk: ${err.message || err}`;
    }

    const response = {
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
