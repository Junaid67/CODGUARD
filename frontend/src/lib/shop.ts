/**
 * Resolves the current shop domain (e.g. acme.myshopify.com) for the
 * x-shopify-shop-domain header. Prefers App Bridge's config, falling back to
 * the `shop` URL param Shopify appends when loading the embedded app.
 */
export function getShopDomain(): string | null {
  const fromBridge = window.shopify?.config?.shop;
  if (fromBridge) return fromBridge;

  const params = new URLSearchParams(window.location.search);
  return params.get('shop');
}

/** True if App Bridge has initialized (i.e. we're running inside Shopify). */
export function isEmbedded(): boolean {
  return typeof window !== 'undefined' && !!window.shopify;
}
