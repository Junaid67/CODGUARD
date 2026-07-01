import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  Text,
  Badge,
  Button,
  Banner,
  Spinner,
  Icon,
} from '@shopify/polaris';
import { CheckIcon } from '@shopify/polaris-icons';
import { PLAN_DEFINITIONS, FREE_TRIAL_DAYS } from '../constants/plans';
import { Plan, BillingStatus } from '../types/billing';
import { getCurrentBilling, subscribe } from '../api/billing';
import { getApiErrorMessage } from '../lib/api';

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subscribingPlan, setSubscribingPlan] = useState<Plan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentBilling()
      .then(setBilling)
      .catch((err) => setLoadError(getApiErrorMessage(err, 'Could not load billing status')))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan: Plan) {
    setSubscribingPlan(plan);
    setActionError(null);
    try {
      const result = await subscribe(plan);
      if (result.confirmationUrl) {
        const top = window.top ?? window;
        top.location.href = result.confirmationUrl;
        return;
      }
      setBilling(result);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not start subscription'));
    } finally {
      setSubscribingPlan(null);
    }
  }

  if (loading) {
    return (
      <Page title="Billing">
        <Card>
          <InlineStack gap="200" blockAlign="center">
            <Spinner size="small" />
            <Text as="span">Loading billing status…</Text>
          </InlineStack>
        </Card>
      </Page>
    );
  }

  if (loadError || !billing) {
    return (
      <Page title="Billing">
        <Banner tone="critical">{loadError ?? 'Could not load billing status'}</Banner>
      </Page>
    );
  }

  return (
    <Page title="Billing">
      <BlockStack gap="400">
        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingMd">
              Current plan
            </Text>
            <Badge tone="success" size="large">
              {PLAN_DEFINITIONS.find((p) => p.plan === billing.plan)?.name ?? billing.plan}
            </Badge>
          </InlineStack>
        </Card>

        {actionError && <Banner tone="critical">{actionError}</Banner>}

        <InlineGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="400">
          {PLAN_DEFINITIONS.map((def) => {
            const isCurrent = def.plan === billing.plan;
            return (
              <Card key={def.plan} background={isCurrent ? 'bg-surface-secondary' : undefined}>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingMd">
                        {def.name}
                      </Text>
                      {isCurrent && <Badge tone="success">Current plan</Badge>}
                    </InlineStack>
                    <InlineStack gap="100" blockAlign="baseline">
                      <Text as="span" variant="heading2xl">
                        ${def.priceUsd}
                      </Text>
                      <Text as="span" tone="subdued">
                        / month
                      </Text>
                    </InlineStack>
                    <Text as="p" tone="subdued">
                      {def.monthlyOrders == null
                        ? 'Unlimited orders'
                        : `Up to ${def.monthlyOrders.toLocaleString()} orders / month`}
                    </Text>
                    {def.priceUsd > 0 && (
                      <Text as="p" tone="subdued">
                        {FREE_TRIAL_DAYS}-day free trial
                      </Text>
                    )}
                  </BlockStack>

                  <BlockStack gap="200">
                    {def.features.map((feature) => (
                      <InlineStack key={feature} gap="200" blockAlign="start" wrap={false}>
                        <Icon source={CheckIcon} tone="success" />
                        <Text as="span">{feature}</Text>
                      </InlineStack>
                    ))}
                  </BlockStack>

                  <Button
                    variant={isCurrent ? 'secondary' : 'primary'}
                    disabled={isCurrent}
                    loading={subscribingPlan === def.plan}
                    onClick={() => handleUpgrade(def.plan)}
                    fullWidth
                  >
                    {isCurrent ? 'Current plan' : def.plan === Plan.FREE ? 'Downgrade' : 'Upgrade'}
                  </Button>
                </BlockStack>
              </Card>
            );
          })}
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
