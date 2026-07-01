/**
 * DEV-ONLY: mints a Shopify App Bridge session token (HS256 JWT) signed with
 * SHOPIFY_API_SECRET, so authenticated API routes can be tested locally with
 * curl — no browser / dev store required.
 *
 * Usage:
 *   node scripts/dev-session-token.js [shop-domain]
 *   node scripts/dev-session-token.js test-store.myshopify.com
 *
 * Then:
 *   TOKEN=$(node scripts/dev-session-token.js test-store.myshopify.com)
 *   curl -H "Authorization: Bearer $TOKEN" \
 *        -H "x-shopify-shop-domain: test-store.myshopify.com" \
 *        http://localhost:5000/api/v1/store/settings
 *
 * NEVER use this against production — it forges the token Shopify normally issues.
 */
require('dotenv').config();
const crypto = require('crypto');

const shop = process.argv[2] || 'test-store.myshopify.com';
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error('SHOPIFY_API_KEY / SHOPIFY_API_SECRET missing in .env');
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const now = Math.floor(Date.now() / 1000);
const header = { alg: 'HS256', typ: 'JWT' };
const payload = {
  iss: `https://${shop}/admin`,
  dest: `https://${shop}`,
  aud: apiKey,
  sub: '1', // Shopify user id → becomes the audit "actor"
  exp: now + 3600,
  nbf: now - 10,
  iat: now,
  jti: crypto.randomUUID(),
  sid: crypto.randomUUID(),
};

const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
const signature = b64url(
  crypto.createHmac('sha256', apiSecret).update(signingInput).digest(),
);

process.stdout.write(`${signingInput}.${signature}`);
