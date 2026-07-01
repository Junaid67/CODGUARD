/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SHOPIFY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * The global `shopify` object injected by App Bridge's CDN script (see
 * index.html). Only a subset of its surface is typed here — what the app uses.
 */
interface ShopifyGlobal {
  idToken(): Promise<string>;
  config: {
    apiKey: string;
    shop?: string;
    host?: string;
    locale?: string;
  };
  toast: {
    show(message: string, options?: { isError?: boolean; duration?: number }): void;
  };
}

interface Window {
  shopify?: ShopifyGlobal;
}
