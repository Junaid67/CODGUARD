import axios, { AxiosError, AxiosInstance } from 'axios';
import { getShopDomain } from './shop';

const DEV = import.meta.env.DEV;

/**
 * Backend API envelope shapes (mirrors the NestJS wrappers).
 */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorShape {
  name: string;
  message: string;
}

export interface ApiErrorBody {
  errors: ApiErrorShape[];
  statusCode?: number;
  requestId?: string;
}

/**
 * Axios instance pointed at the NestJS backend (VITE_API_URL). Every request
 * carries:
 *   - Authorization: Bearer <App Bridge session token>
 *   - x-shopify-shop-domain: <shop>
 */
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  // App Bridge mints a fresh, short-lived session token on demand.
  if (window.shopify?.idToken) {
    try {
      const token = await window.shopify.idToken();
      config.headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // Outside the Shopify iframe there's no token — request will 401.
    }
  }

  const shop = getShopDomain();
  if (shop) config.headers.set('x-shopify-shop-domain', shop);

  if (DEV) {
    console.log(`[API →] ${(config.method ?? 'get').toUpperCase()} ${config.url}`, config.data ?? '');
  }

  return config;
});

// With the legacy install flow, "install" IS the OAuth grant: when the backend
// has no row for this shop (404 Store not found), the app must break out of
// the iframe and start OAuth so the callback can create the store + token.
let oauthRedirectStarted = false;

function redirectToOAuth(shop: string): void {
  oauthRedirectStarted = true;
  // VITE_API_URL may be relative ("/api/v1") or absolute; resolve it against
  // our own origin so the top-window navigation targets our app host, not the
  // Shopify admin origin the iframe is embedded in.
  const base = new URL(import.meta.env.VITE_API_URL || '/api/v1', window.location.origin);
  const authUrl = new URL(`${base.pathname.replace(/\/$/, '')}/auth`, base.origin);
  authUrl.searchParams.set('shop', shop);
  if (DEV) console.warn(`[API] Store not registered — starting OAuth: ${authUrl.href}`);
  // OAuth cannot run inside the embedded iframe. App Bridge v4 patches
  // window.open so target "_top" navigates the admin's top window — direct
  // window.top.location assignment is silently blocked cross-origin.
  window.open(authUrl.href, '_top');
}

// Log responses and errors in dev so every API call is visible in DevTools.
api.interceptors.response.use(
  (response) => {
    if (DEV) {
      console.log(`[API ←] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    if (DEV) {
      const status = error.response?.status ?? '(no response)';
      const body = error.response?.data ?? error.message;
      console.error(`[API ✗] ${status} ${error.config?.url}`, body);
    }

    const firstError = error.response?.data?.errors?.[0];
    const shop = getShopDomain();
    if (
      !oauthRedirectStarted &&
      shop &&
      error.response?.status === 404 &&
      firstError?.message?.startsWith('Store not found')
    ) {
      redirectToOAuth(shop);
    }

    return Promise.reject(error);
  },
);

/**
 * Extracts a human-readable message from a backend error envelope.
 * In dev mode the error name/code is prepended so banners are actionable.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosErr = error as AxiosError<ApiErrorBody>;
  const first = axiosErr?.response?.data?.errors?.[0];
  if (!first) return axiosErr?.message ?? fallback;
  const prefix = DEV && first.name && first.name !== first.message ? `[${first.name}] ` : '';
  return `${prefix}${first.message}`;
}

/** Unwraps a `{ data }` success envelope. */
export function unwrap<T>(body: ApiSuccess<T>): T {
  return body.data;
}
