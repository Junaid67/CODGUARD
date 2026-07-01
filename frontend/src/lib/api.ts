import axios, { AxiosError, AxiosInstance } from 'axios';
import { getShopDomain } from './shop';

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

  return config;
});

/**
 * Extracts a human-readable message from a backend error envelope.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosErr = error as AxiosError<ApiErrorBody>;
  const first = axiosErr?.response?.data?.errors?.[0];
  return first?.message ?? axiosErr?.message ?? fallback;
}

/** Unwraps a `{ data }` success envelope. */
export function unwrap<T>(body: ApiSuccess<T>): T {
  return body.data;
}
