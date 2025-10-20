const { admin, requireRole, json, CORS_HEADERS } = require("./_lib/auth");

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
    await requireRole(event, "admin");

    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim().toLowerCase();
    const displayName = (body.displayName || "").trim();
    const role = normaliseRole(body.role);
    const orgKey = (body.orgKey || "").trim() || null;

    if (!email) {
      return json({ ok: false, error: "Missing email" }, 400);
    }

    const user = await upsertUser(email, displayName);
    const prevClaims = user.customClaims || {};
    const nextClaims = { ...prevClaims };
    nextClaims.role = role;
    if (orgKey) {
      nextClaims.orgKey = orgKey;
    } else {
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
        orgKey,
        inviteLink: null,
        emailSent: false,
        note:
          "firebase-admin mangler generateSignInWithEmailLink(). Oppgrader SDK eller send lenke fra klient.",
      });
    }

    let emailSent = false;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
      try {
        const nodemailer = await import("nodemailer").then((m) => m.default || m);
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT) || 587,
          secure: false,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        await transporter.sendMail({
          from: SMTP_FROM,
          to: email,
          subject: "NFCKING – invitasjon",
          html: `
            <p>Hei${displayName ? ` ${displayName}` : ""}!</p>
            <p>Du er invitert til NFCKING administrasjon. Klikk lenken under for å logge inn:</p>
            <p><a href="${inviteLink}">Fullfør innlogging</a></p>
            <p>Hvis knappen ikke fungerer, kopier denne URLen inn i nettleseren:</p>
            <p style="word-break:break-all">${inviteLink}</p>
          `,
        });
        emailSent = true;
      } catch (err) {
        return json({
          ok: true,
          uid: user.uid,
          role,
          orgKey,
          inviteLink,
          emailSent: false,
          note:
            "SMTP-variabler er satt, men e-post kunne ikke sendes. Kontroller nodemailer og legitimasjon.",
        });
      }
    }

    return json({
      ok: true,
      uid: user.uid,
      role,
      orgKey,
      inviteLink,
      emailSent,
    });
  } catch (err) {
    return json({ ok: false, error: err.message || "Internal error" }, err.statusCode || 500);
  }
};
