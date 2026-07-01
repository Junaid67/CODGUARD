import { NavMenu } from '@shopify/app-bridge-react';

/**
 * Renders the app's navigation into the Shopify Admin sidebar (App Bridge
 * NavMenu). The first link must have rel="home". App Bridge intercepts clicks
 * and drives them through the History API, which React Router picks up.
 */
export function AppNavMenu() {
  return (
    <NavMenu>
      <a href="/" rel="home">
        Home
      </a>
      <a href="/onboarding">Onboarding</a>
      <a href="/orders">Orders</a>
      <a href="/settings">Settings</a>
      <a href="/billing">Billing</a>
    </NavMenu>
  );
}
