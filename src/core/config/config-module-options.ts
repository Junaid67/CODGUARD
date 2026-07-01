import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';
import { configurations } from './app.config';

/**
 * Joi validation schema for environment variables. The app refuses to boot if
 * required secrets are missing or malformed. ENCRYPTION_KEY and HASH_SECRET
 * must be 64 hex chars (32 bytes) — generate with `openssl rand -hex 32`.
 */
const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  APP_URL: Joi.string().uri().required(),
  CORS_WHITELIST: Joi.string().allow('').default(''),

  // Shopify
  SHOPIFY_API_KEY: Joi.string().required(),
  SHOPIFY_API_SECRET: Joi.string().required(),
  SHOPIFY_SCOPES: Joi.string().required(),

  // Database — either DATABASE_URL or discrete DB_* vars.
  DATABASE_URL: Joi.string().allow('').optional(),
  DB_HOST: Joi.string().when('DATABASE_URL', {
    is: Joi.string().min(1),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().when('DATABASE_URL', {
    is: Joi.string().min(1),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_USERNAME: Joi.string().when('DATABASE_URL', {
    is: Joi.string().min(1),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PASSWORD: Joi.string()
    .allow('')
    .when('DATABASE_URL', {
      is: Joi.string().min(1),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),

  // Encryption
  ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
  HASH_SECRET: Joi.string().min(16).required(),

  // Session
  SESSION_SECRET: Joi.string().min(16).required(),
}).unknown(true);

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  envFilePath: ['.env'],
  load: configurations,
  validationSchema,
  validationOptions: {
    abortEarly: false,
  },
};
