import { registerAs } from '@nestjs/config';

/**
 * Strongly-typed, namespaced configuration mapped from environment variables.
 * Access via ConfigService, e.g. configService.get('encryption.key').
 */

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '5000', 10),
  // `shopify app dev` injects SHOPIFY_APP_URL with the current tunnel host —
  // takes priority over the static .env APP_URL so OAuth redirect/callback
  // URLs always point at a host Shopify can actually reach.
  url: process.env.SHOPIFY_APP_URL ?? process.env.APP_URL,
  corsWhitelist: (process.env.CORS_WHITELIST ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
}));

export const shopifyConfig = registerAs('shopify', () => ({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  scopes: (process.env.SHOPIFY_SCOPES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  name: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
}));

export const encryptionConfig = registerAs('encryption', () => ({
  key: process.env.ENCRYPTION_KEY,
  hashSecret: process.env.HASH_SECRET,
}));

export const sessionConfig = registerAs('session', () => ({
  secret: process.env.SESSION_SECRET,
}));

export const configurations = [
  appConfig,
  shopifyConfig,
  databaseConfig,
  encryptionConfig,
  sessionConfig,
];
