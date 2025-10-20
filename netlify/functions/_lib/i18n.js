const { db } = require('./firebaseAdmin');

const COLLECTION = 'system';
const DOC_ID = 'i18n';
const docRef = db.collection(COLLECTION).doc(DOC_ID);

const DEFAULT_LANGS = ['nb', 'en'];

const DEFAULT_KEYS = {
  'app.title': { nb: 'NFCKING administrasjon', en: 'NFCKING administration' },
  'nav.home': { nb: 'Hjem', en: 'Home' },
  'nav.order': { nb: 'Bestill', en: 'Order' },
  'nav.demo': { nb: 'Demo', en: 'Demo' },
  'nav.superadmin': { nb: 'Superadmin', en: 'Superadmin' },
  'nav.cards': { nb: 'Kort', en: 'Cards' },
  'tab.branding': { nb: 'Branding', en: 'Branding' },
  'tab.lang': { nb: 'Språk', en: 'Languages' },
  'tab.users': { nb: 'Brukere', en: 'Users' },
  'tab.pages': { nb: 'Sider', en: 'Pages' },
  'tab.stripe': { nb: 'Stripe', en: 'Stripe' },
  'tab.orders': { nb: 'Ordrer', en: 'Orders' },
  'tab.nfc': { nb: 'NFC-Batcher', en: 'NFC batches' },
  'tab.seo': { nb: 'SEO', en: 'SEO' },
  'tab.settings': { nb: 'System', en: 'System' },
  'cta.login': { nb: 'Logg inn', en: 'Log in' },
  'cta.logout': { nb: 'Logg ut', en: 'Log out' },
  'cta.invite': { nb: 'Send invitasjon', en: 'Send invite' },
  'cta.save': { nb: 'Lagre', en: 'Save' },
  'cta.cancel': { nb: 'Avbryt', en: 'Cancel' },
  'cta.addLanguage': { nb: 'Legg til språk', en: 'Add language' },
  'cta.addKey': { nb: 'Legg til nøkkel', en: 'Add key' },
  'cta.export': { nb: 'Eksporter', en: 'Export' },
  'cta.import': { nb: 'Importer', en: 'Import' },
  'users.status.active': { nb: 'Aktiv', en: 'Active' },
  'users.status.disabled': { nb: 'Deaktivert', en: 'Disabled' },
  'users.role.viewer': { nb: 'Leser', en: 'Viewer' },
  'users.role.support': { nb: 'Support', en: 'Support' },
  'users.role.editor': { nb: 'Redaktør', en: 'Editor' },
  'users.role.admin': { nb: 'Administrator', en: 'Administrator' },
  'users.role.owner': { nb: 'Eier', en: 'Owner' },
  'users.role.superadmin': { nb: 'Superadministrator', en: 'Super administrator' },
  'lang.default': { nb: 'Standardspråk', en: 'Default language' },
  'lang.available': { nb: 'Tilgjengelige språk', en: 'Available languages' },
  'lang.key': { nb: 'Nøkkel', en: 'Key' },
  'lang.value': { nb: 'Verdi', en: 'Value' },
  'lang.search': { nb: 'Søk i nøklene', en: 'Search keys' },
  'lang.reset': { nb: 'Tilbakestill', en: 'Reset' },
  'lang.lastUpdated': { nb: 'Sist oppdatert', en: 'Last updated' },
  'status.loading': { nb: 'Laster …', en: 'Loading…' },
  'status.error': { nb: 'Noe gikk galt', en: 'Something went wrong' },
  'status.success': { nb: 'Fullført', en: 'Completed' },
};

function sanitizeLang(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const cleaned = trimmed.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!cleaned) return null;
  return cleaned.slice(0, 12);
}

function sanitizeLangList(input, fallback = DEFAULT_LANGS) {
  const set = new Set();
  if (Array.isArray(input)) {
    input.forEach((entry) => {
      const clean = sanitizeLang(entry);
      if (clean) set.add(clean);
    });
  } else if (typeof input === 'string') {
    input.split(/[,\s]+/).forEach((part) => {
      const clean = sanitizeLang(part);
      if (clean) set.add(clean);
    });
  }
  if (!set.size && Array.isArray(fallback)) {
    fallback.forEach((lang) => {
      const clean = sanitizeLang(lang);
      if (clean) set.add(clean);
    });
  }
  return Array.from(set);
}

function sanitizeKey(key) {
  if (key === null || key === undefined) return null;
  const trimmed = String(key).trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) return null;
  return trimmed;
}

function ensureKeyLanguages(map, langs) {
  const result = {};
  Object.entries(map || {}).forEach(([key, value]) => {
    const cleanKey = sanitizeKey(key);
    if (!cleanKey) return;
    const row = {};
    langs.forEach((lang) => {
      const raw = value && typeof value === 'object' ? value[lang] : '';
      row[lang] = typeof raw === 'string' ? raw : raw === null || raw === undefined ? '' : String(raw);
    });
    result[cleanKey] = row;
  });
  return result;
}

function defaultDocument() {
  const langs = [...DEFAULT_LANGS];
  return {
    defaultLang: 'nb',
    activeLangs: langs,
    keys: ensureKeyLanguages(DEFAULT_KEYS, langs),
    updatedAt: null,
    updatedBy: null,
    source: 'default',
  };
}

function normalisePayload(payload = {}) {
  const langs = sanitizeLangList(payload.activeLangs || payload.langs || []);
  const defaultLang = sanitizeLang(payload.defaultLang) || langs[0] || DEFAULT_LANGS[0];
  if (!langs.includes(defaultLang)) langs.unshift(defaultLang);
  const keys = ensureKeyLanguages(payload.keys || payload.data || {}, langs.length ? langs : DEFAULT_LANGS);
  return {
    defaultLang,
    activeLangs: langs.length ? langs : [...DEFAULT_LANGS],
    keys: Object.keys(keys).length ? keys : ensureKeyLanguages(DEFAULT_KEYS, langs.length ? langs : DEFAULT_LANGS),
  };
}

async function getI18nSettings() {
  const snap = await docRef.get();
  if (!snap.exists) {
    return defaultDocument();
  }
  const data = snap.data() || {};
  const normalised = normalisePayload(data);
  return {
    ...normalised,
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || null,
    source: data.source || 'firestore',
  };
}

async function saveI18nSettings(input, context = {}) {
  const payload = normalisePayload(input);
  const doc = {
    defaultLang: payload.defaultLang,
    activeLangs: payload.activeLangs,
    keys: payload.keys,
    updatedAt: new Date().toISOString(),
    updatedBy: context.updatedBy || context.email || context.uid || null,
    source: 'firestore',
  };
  await docRef.set(doc, { merge: false });
  return doc;
}

module.exports = {
  getI18nSettings,
  saveI18nSettings,
  defaultDocument,
};
