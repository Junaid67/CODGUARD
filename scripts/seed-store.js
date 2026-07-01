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

const shop = process.argv[2] || 'test-store.myshopify.com';

(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();

  // access_token is a placeholder — GET endpoints don't decrypt it; only real
  // Shopify calls (tagging/scan) would, which aren't exercised in Tier 2.
  await client.query(
    `INSERT INTO stores
       (shop_domain, access_token, plan, rto_signals, rto_tags,
        onboarding_complete, terms_accepted, monthly_order_count)
     VALUES ($1, $2, 'free', $3::jsonb, $4::text[], false, false, 0)
     ON CONFLICT (shop_domain) DO UPDATE
       SET rto_signals = EXCLUDED.rto_signals,
           rto_tags    = EXCLUDED.rto_tags,
           deleted_at  = NULL`,
    [
      shop,
      'seed-placeholder-token',
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
