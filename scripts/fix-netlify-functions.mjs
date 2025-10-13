// scripts/fix-netlify-functions.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, 'netlify', 'functions');
const ADMIN_HTML = path.join(ROOT, 'admin-super.html');

// --- konfig ---
const renameAllowPrefixes = [
  'menu', 'nfc-batches', 'nfc', 'orders', 'pages', 'stripe'
];
const skipDirs = new Set(['_lib']); // ikke rør helper-mappa

// Eksakte erstatninger i admin-super.html (punktum → bindestrek)
const htmlReplacements = [
  // STRIPE
  ['/.netlify/functions/stripe.config',       '/.netlify/functions/stripe-config'],
  ['/.netlify/functions/stripe.products',     '/.netlify/functions/stripe-products'],
  ['/.netlify/functions/stripe.prices',       '/.netlify/functions/stripe-prices'],
  ['/.netlify/functions/stripe.charges',      '/.netlify/functions/stripe-charges'],
  ['/.netlify/functions/stripe.customers',    '/.netlify/functions/stripe-customers'],
  ['/.netlify/functions/stripe.refund',       '/.netlify/functions/stripe-refund'],
  ['/.netlify/functions/stripe.test-payment', '/.netlify/functions/stripe-test-payment'],
  ['/.netlify/functions/stripe.webhook',      '/.netlify/functions/stripe-webhook'],

  // ORDERS
  ['/.netlify/functions/orders.list',    '/.netlify/functions/orders-list'],
  ['/.netlify/functions/orders.get',     '/.netlify/functions/orders-get'],
  ['/.netlify/functions/orders.update',  '/.netlify/functions/orders-update'],
  ['/.netlify/functions/orders.invoice', '/.netlify/functions/orders-invoice'],
  ['/.netlify/functions/orders.email',   '/.netlify/functions/orders-email'],
  ['/.netlify/functions/orders.refund',  '/.netlify/functions/orders-refund'],

  // NFC
  ['/.netlify/functions/nfc-batches.list',   '/.netlify/functions/nfc-batches-list'],
  ['/.netlify/functions/nfc-batches.create', '/.netlify/functions/nfc-batches-create'],
  ['/.netlify/functions/nfc-batches.get',    '/.netlify/functions/nfc-batches-get'],
  ['/.netlify/functions/nfc-batches.start',  '/.netlify/functions/nfc-batches-start'],
  ['/.netlify/functions/nfc-batches.stop',   '/.netlify/functions/nfc-batches-stop'],
  ['/.netlify/functions/nfc-batches.files',  '/.netlify/functions/nfc-batches-files'],
  ['/.netlify/functions/nfc-batches.verify', '/.netlify/functions/nfc-batches-verify'],
  ['/.netlify/functions/nfc.encode',         '/.netlify/functions/nfc-encode'],

  // MENU (hvis brukt)
  ['/.netlify/functions/menu.get',  '/.netlify/functions/menu-get'],
  ['/.netlify/functions/menu.save', '/.netlify/functions/menu-save'],
];

const DRY_RUN = process.argv.includes('--dry');

// utils
const isJsFile = (f) => f.toLowerCase().endsWith('.js');
const needsRename = (name) => {
  if (!name.includes('.')) return false; // ingen punktum → OK
  if (!isJsFile(name)) return false;
  const base = name.replace(/\.js$/i, '');
  // hopp over private/utility filer som starter med _
  if (base.startsWith('_')) return false;
  // bare filer som starter med kjente prefikser
  return renameAllowPrefixes.some((p) => base.startsWith(p));
};

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (skipDirs.has(e.name)) continue;
      const sub = await walk(path.join(dir, e.name));
      out.push(...sub);
    } else if (e.isFile()) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

async function renameFunctions() {
  const files = await walk(FUNCTIONS_DIR);
  const renames = [];
  for (const file of files) {
    const name = path.basename(file);
    const dir = path.dirname(file);
    if (needsRename(name)) {
      const newName = name.replace(/\.js$/i, '').replace(/\./g, '-') + '.js';
      const to = path.join(dir, newName);
      renames.push([file, to]);
    }
  }

  if (!renames.length) {
    console.log('Ingen filer trenger rename ✅');
    return { changed: [] };
  }

  console.log(`Skal rename ${renames.length} filer:`);
  for (const [from, to] of renames) {
    console.log(' -', path.relative(ROOT, from), '→', path.relative(ROOT, to));
    if (!DRY_RUN) await fs.rename(from, to);
  }
  return { changed: renames };
}

async function patchAdminHtml() {
  try {
    let html = await fs.readFile(ADMIN_HTML, 'utf8');
    let before = html;
    for (const [from, to] of htmlReplacements) {
      html = html.split(from).join(to);
    }
    if (html !== before) {
      console.log('Oppdaterer admin-super.html API-URLer…');
      if (!DRY_RUN) await fs.writeFile(ADMIN_HTML, html, 'utf8');
      return true;
    } else {
      console.log('Ingen endringer i admin-super.html nødvendig ✅');
      return false;
    }
  } catch (e) {
    console.warn('Fant ikke admin-super.html – hopper over (ok hvis filnavn er annet).');
    return false;
  }
}

async function patchStripeWebhookPath() {
  // Finn en stripe-webhook-fil og sørg for riktig exports.config.path
  // (no-op hvis ikke finnes)
  const files = await walk(FUNCTIONS_DIR);
  const webhookFile = files.find(f => /stripe[-.]webhook\.js$/i.test(f));
  if (!webhookFile) {
    console.log('Fant ikke stripe-webhook.js – hopper over.');
    return false;
  }
  let src = await fs.readFile(webhookFile, 'utf8');
  const wanted = "path: '/.netlify/functions/stripe-webhook'";
  if (src.includes("path: '/.netlify/functions/stripe.webhook'")) {
    console.log('Oppdaterer stripe-webhook path → bindestrek');
    src = src.replace("path: '/.netlify/functions/stripe.webhook'", wanted);
    if (!DRY_RUN) await fs.writeFile(webhookFile, src, 'utf8');
    return true;
  }
  if (src.includes(wanted)) {
    console.log('stripe-webhook path allerede riktig ✅');
    return false;
  }
  // Hvis ingen config finnes, ikke tving inn.
  console.log('stripe-webhook har ingen exports.config.path – ingenting å gjøre.');
  return false;
}

async function main() {
  console.log('== Fix Netlify functions (rename + HTML patch) ==',
              DRY_RUN ? '[DRY RUN]' : '');
  // sanity
  try { await fs.access(FUNCTIONS_DIR); } 
  catch { 
    console.error('Fant ikke', FUNCTIONS_DIR, '— kjør skriptet i prosjektroten.'); 
    process.exit(1); 
  }

  const { changed } = await renameFunctions();
  const htmlChanged = await patchAdminHtml();
  const webhookPatched = await patchStripeWebhookPath();

  console.log('\nOppsummert:');
  console.log(' - Renamet filer:', changed.length);
  console.log(' - Endret admin-super.html:', htmlChanged ? 'ja' : 'nei');
  console.log(' - stripe-webhook path fikset:', webhookPatched ? 'ja' : 'nei');
  console.log('\nFerdig ✅');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
