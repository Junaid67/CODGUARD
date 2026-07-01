import { ReactNode } from 'react';
import { AppProvider } from '@shopify/polaris';
import type { LinkLikeComponentProps } from '@shopify/polaris/build/ts/src/utilities/link';
import enTranslations from '@shopify/polaris/locales/en.json';
import { useNavigate } from 'react-router-dom';
import '@shopify/polaris/build/esm/styles.css';

/**
 * Routes Polaris links (Button url, Link, etc.) through React Router for
 * internal paths, and opens external/absolute URLs in a new tab.
 */
function RouterLink({ url, children, external, ...rest }: LinkLikeComponentProps) {
  const navigate = useNavigate();
  const isExternal = external || /^https?:\/\//.test(url);

  if (isExternal) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault();
        navigate(url);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/**
 * App-wide provider: Polaris (theme, i18n, routing-aware links). App Bridge
 * itself is initialized by the CDN script + meta tag in index.html, so no
 * React provider is needed for it in v4 — the global `shopify` object is ready
 * by the time React mounts.
 */
export function AppBridgeProvider({ children }: { children: ReactNode }) {
  return (
    <AppProvider i18n={enTranslations} linkComponent={RouterLink}>
      {children}
    </AppProvider>
  );
}
