/**
 * DEV-ONLY: seeds a test store row so authenticated endpoints have something to
 * read (OAuth install can't run locally without Shopify). Idempotent — re-runs
 * just update the row.
 *
 * Usage:
 *   node scripts/seed-store.js [shop-domain]
 *   node scripts/seed-store.js test-store.myshopify.com
 */
require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');

/** Mirrors EncryptionService.encrypt so the stored token passes decrypt() without crashing. */
function encryptToken(value) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

const shop = process.argv[2] || 'test-store.myshopify.com';
// Optionally pass a real Admin API access token as the third argument so
// Shopify API calls (scan, billing, tagging) work in dev without full OAuth.
//   node scripts/seed-store.js my-store.myshopify.com shpat_realtoken
const realToken = process.argv[3] ?? null;

(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();

  const encryptedToken = encryptToken(realToken ?? 'seed-placeholder-token');
  if (realToken) {
    console.log('Using real token — Shopify API calls will work.');
  } else {
    console.log('Using placeholder token — UI works but scan/billing will 401.');
  }

  await client.query(
    `INSERT INTO stores
       (shop_domain, access_token, plan, rto_signals, rto_tags,
        onboarding_complete, terms_accepted, monthly_order_count)
     VALUES ($1, $2, 'free', $3::jsonb, $4::text[], false, false, 0)
     ON CONFLICT (shop_domain) DO UPDATE
       SET access_token = EXCLUDED.access_token,
           rto_signals  = EXCLUDED.rto_signals,
           rto_tags     = EXCLUDED.rto_tags,
           deleted_at   = NULL`,
    [
      shop,
      encryptedToken,
      JSON.stringify(['CANCELLED', 'TAG', 'REFUNDED']),
      ['rto', 'returned', 'wapas'],
    ],
  );

  const r = await client.query(
    'SELECT id, shop_domain, plan FROM stores WHERE shop_domain = $1',
    [shop],
  );
  console.log('Seeded store:', r.rows[0]);
  await client.end();
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
