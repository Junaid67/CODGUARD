/**
 * DEV-ONLY: posts a Shopify webhook to the local server with a VALID HMAC
 * (computed from SHOPIFY_API_SECRET over the exact raw body). Lets you exercise
 * the full webhook pipeline — risk scoring, DB writes — without Shopify. The
 * outbound order-tagging call fails silently (no real Shopify), by design.
 *
 * Usage:
 *   node scripts/dev-webhook.js <path> <shop> '<json-body>'
 *
 * Examples:
 *   node scripts/dev-webhook.js orders/create test-store.myshopify.com \
 *     '{"id":1001,"name":"#1001","phone":"03001234567","total_price":"2500","currency":"PKR"}'
 *   node scripts/dev-webhook.js orders/cancelled test-store.myshopify.com '{"id":1001}'
 */
require('dotenv').config();
const crypto = require('crypto');

const path = process.argv[2];
const shop = process.argv[3];
const body = process.argv[4] || '{}';

if (!path || !shop) {
  console.error("Usage: node scripts/dev-webhook.js <path> <shop> '<json-body>'");
  process.exit(1);
}

const secret = process.env.SHOPIFY_API_SECRET;
const port = process.env.PORT || 5000;

const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

(async () => {
  const res = await fetch(`http://localhost:${port}/api/v1/webhooks/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-hmac-sha256': hmac,
      'x-shopify-shop-domain': shop,
      'x-shopify-topic': path,
    },
    body,
  });
  console.log(`${res.status} ${res.statusText}`);
  console.log(await res.text());
})().catch((e) => {
  console.error('Request failed:', e.message);
  process.exit(1);
});
