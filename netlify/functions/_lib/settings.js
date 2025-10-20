const { db } = require('./firebaseAdmin');

const SETTINGS_COLLECTION = 'system';
const SETTINGS_DOC_ID = 'settings';
const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);

function cleanString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
}

function parseBool(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const str = String(value).trim().toLowerCase();
  if (!str) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(str)) return true;
  if (['0', 'false', 'no', 'off'].includes(str)) return false;
  return fallback;
}

function parsePort(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

async function readSettingsDoc() {
  const snap = await docRef.get();
  if (!snap.exists) return {};
  const data = snap.data() || {};
  return data;
}

async function getSmtpSettings() {
  const data = await readSettingsDoc();
  return data.smtp || {};
}

function sanitizeSmtpForClient(input = {}) {
  const host = cleanString(input.host);
  const port = parsePort(input.port);
  const secure = parseBool(input.secure, false);
  const user = cleanString(input.user);
  const from = cleanString(input.from);
  const replyTo = cleanString(input.replyTo);
  const enabled = parseBool(input.enabled, Boolean(host && input.pass));
  const updatedAt = input.updatedAt || null;
  const updatedBy = cleanString(input.updatedBy || '');
  return {
    host,
    port: port || '',
    secure,
    user,
    from,
    replyTo,
    enabled,
    hasPass: Boolean(input.pass),
    updatedAt,
    updatedBy: updatedBy || null,
  };
}

function getEnvSmtp(rawPass = false) {
  const host = cleanString(process.env.SMTP_HOST || '');
  const user = cleanString(process.env.SMTP_USER || '');
  const pass = process.env.SMTP_PASS;
  const from = cleanString(process.env.SMTP_FROM || '');
  if (!host || !user || !pass || !from) return null;
  const port = parsePort(process.env.SMTP_PORT) || 587;
  const secure = parseBool(process.env.SMTP_SECURE, port === 465);
  const replyTo = cleanString(process.env.SMTP_REPLY_TO || '');
  const enabled = parseBool(process.env.SMTP_ENABLED, true);
  if (!enabled) return null;
  const config = {
    host,
    port,
    secure,
    user,
    from,
    replyTo,
    enabled: true,
    source: 'env',
  };
  if (rawPass) {
    config.pass = String(pass);
  }
  return config;
}

function buildSendConfig(source, input = {}) {
  const host = cleanString(input.host);
  const user = cleanString(input.user);
  const pass = input.pass && typeof input.pass === 'string' ? input.pass : '';
  const from = cleanString(input.from);
  const enabled = parseBool(input.enabled, true);
  if (!host || !user || !pass || !from || !enabled) return null;
  const port = parsePort(input.port) || 587;
  const secure = parseBool(input.secure, port === 465);
  const replyTo = cleanString(input.replyTo);
  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    replyTo,
    enabled: true,
    source,
  };
}

async function loadSmtpConfig() {
  const env = getEnvSmtp(true);
  if (env && env.pass) {
    return env;
  }
  const stored = await getSmtpSettings();
  return buildSendConfig('firestore', stored);
}

async function saveSmtpSettings(input, context = {}) {
  const current = await getSmtpSettings();
  const next = { ...current };

  next.host = cleanString(input.host);
  next.user = cleanString(input.user);
  next.from = cleanString(input.from);
  next.replyTo = cleanString(input.replyTo);
  next.secure = parseBool(input.secure, false);
  next.enabled = parseBool(input.enabled, false);

  const port = parsePort(input.port);
  if (port) next.port = port;
  else delete next.port;

  if (input.pass === null || input.pass === undefined) {
    // keep existing
  } else if (typeof input.pass === 'string' && input.pass.length === 0) {
    delete next.pass;
  } else {
    next.pass = String(input.pass);
  }

  if (next.enabled) {
    if (!next.host || !next.user || !next.from || !next.pass) {
      throw new Error('Aktivert SMTP krever host, brukernavn, avsender og passord/API-nøkkel');
    }
  }

  next.updatedAt = new Date().toISOString();
  next.updatedBy = cleanString(context.updatedBy || context.uid || '');

  await docRef.set({ smtp: next }, { merge: true });

  return next;
}

async function sendSmtpMail(config, message) {
  if (!config) throw new Error('SMTP er ikke konfigurert');
  const host = cleanString(config.host);
  const user = cleanString(config.user);
  const pass = config.pass && typeof config.pass === 'string' ? config.pass : '';
  const from = cleanString(config.from);
  if (!host || !user || !pass || !from) {
    throw new Error('Ufullstendig SMTP-oppsett');
  }
  const nodemailer = await import('nodemailer').then((m) => m.default || m);
  const port = parsePort(config.port) || 587;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: parseBool(config.secure, port === 465),
    auth: { user, pass },
  });
  const mail = {
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  };
  const replyTo = cleanString(config.replyTo);
  if (replyTo) {
    mail.replyTo = replyTo;
  }
  return transporter.sendMail(mail);
}

module.exports = {
  getSmtpSettings,
  sanitizeSmtpForClient,
  loadSmtpConfig,
  saveSmtpSettings,
  sendSmtpMail,
  getEnvSmtpConfig: (rawPass = false) => getEnvSmtp(rawPass),
};
