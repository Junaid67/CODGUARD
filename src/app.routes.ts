/**
 * Centralized route path segments per module. Controllers reference these
 * instead of hard-coding strings, keeping the URL surface in one place.
 * Populated as feature modules are added.
 */
export const ROUTES = {
  HEALTH: 'health',
  SHOPIFY_AUTH: 'auth',
  ONBOARDING: 'onboarding',
  STORE: 'store',
  BILLING: 'billing',
  WEBHOOKS: 'webhooks',
  RISK: 'risk',
  ORDERS: 'orders',
  SCAN: 'scan',
};
