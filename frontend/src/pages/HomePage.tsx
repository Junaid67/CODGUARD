import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
  InlineGrid,
  Badge,
  Banner,
  Spinner,
  TextField,
  Divider,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { getStoreSettings } from '../api/store';
import { getOrderStats } from '../api/orders';
import { scorePhone } from '../api/risk';
import { OrderStats, RiskScore } from '../types/order';
import { StoreSettings } from '../types/store';
import { RISK_BADGE_TONE, RISK_LABEL, RISK_RECOMMENDATION } from '../constants/risk';
import { getApiErrorMessage } from '../lib/api';

function MetricTile({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'critical' }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="p" tone="subdued" variant="bodySm">
          {label}
        </Text>
        <Text as="p" variant="headingLg" tone={tone}>
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResult, setLookupResult] = useState<RiskScore | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    getStoreSettings()
      .then((storeSettings) => {
        setSettings(storeSettings);
        if (storeSettings.onboardingComplete) {
          return getOrderStats().then(setStats);
        }
      })
      .catch((err) => setLoadError(getApiErrorMessage(err, 'Could not load dashboard')))
      .finally(() => setLoading(false));
  }, []);

  async function handleLookup() {
    const phone = lookupPhone.trim();
    if (!phone) return;
    setLookingUp(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      setLookupResult(await scorePhone(phone));
    } catch (err) {
      setLookupError(getApiErrorMessage(err, 'Could not score this number'));
    } finally {
      setLookingUp(false);
    }
  }

  if (loading) {
    return (
      <Page title="CODGuard">
        <Card>
          <InlineStack gap="200" blockAlign="center">
            <Spinner size="small" />
            <Text as="span">Loading dashboard…</Text>
          </InlineStack>
        </Card>
      </Page>
    );
  }

  if (!settings?.onboardingComplete) {
    return (
      <Page title="CODGuard">
        {loadError && <Banner tone="critical">{loadError}</Banner>}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Welcome
            </Text>
            <Text as="p" tone="subdued">
              Score incoming COD orders by customer delivery history and decide
              whether to ship, confirm, or request a fee upfront. Complete
              onboarding to import your order history and start scoring.
            </Text>
            <InlineStack gap="300">
              <Button variant="primary" onClick={() => navigate('/onboarding')}>
                Start onboarding
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  const pct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`);
  const currency = 'PKR';

  return (
    <Page
      title="CODGuard"
      subtitle="COD risk overview"
      primaryAction={{ content: 'View orders', onAction: () => navigate('/orders') }}
    >
      <BlockStack gap="400">
        {loadError && <Banner tone="critical">{loadError}</Banner>}

        {stats && (
          <>
            <InlineGrid columns={{ xs: 2, sm: 3, md: 3 }} gap="300">
              <MetricTile label="Total orders" value={String(stats.totalOrders)} />
              <MetricTile label="High risk orders" value={String(stats.highRisk)} tone="critical" />
              <MetricTile label="Low risk orders" value={String(stats.lowRisk)} tone="success" />
              <MetricTile label="COD acceptance rate" value={pct(stats.acceptanceRate)} />
              <MetricTile label="COD rejection rate" value={pct(stats.rejectionRate)} />
              <MetricTile
                label="Est. RTO loss prevented"
                value={`${currency} ${stats.estimatedRtoLossPrevented.toLocaleString()}`}
                tone="success"
              />
            </InlineGrid>

            <Card>
              <InlineStack gap="400" wrap>
                <Text as="span" tone="subdued">
                  Pending: <Text as="span" fontWeight="semibold">{stats.pending}</Text>
                </Text>
                <Text as="span" tone="subdued">
                  Delivered: <Text as="span" fontWeight="semibold">{stats.delivered}</Text>
                </Text>
                <Text as="span" tone="subdued">
                  RTO: <Text as="span" fontWeight="semibold">{stats.rto}</Text>
                </Text>
                <Text as="span" tone="subdued">
                  Medium risk: <Text as="span" fontWeight="semibold">{stats.mediumRisk}</Text>
                </Text>
                <Text as="span" tone="subdued">
                  Unknown: <Text as="span" fontWeight="semibold">{stats.unknownRisk}</Text>
                </Text>
              </InlineStack>
            </Card>
          </>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Check a phone number
            </Text>
            <Text as="p" tone="subdued">
              Look up a customer's delivery reputation across the CODGuard network
              before you ship.
            </Text>

            <InlineStack gap="200" blockAlign="end">
              <div style={{ minWidth: 240 }}>
                <TextField
                  label="Phone number"
                  value={lookupPhone}
                  onChange={setLookupPhone}
                  autoComplete="off"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleLookup}
                loading={lookingUp}
                disabled={!lookupPhone.trim()}
              >
                Check
              </Button>
            </InlineStack>

            {lookupError && <Banner tone="critical">{lookupError}</Banner>}

            {lookupResult && (
              <BlockStack gap="200">
                <Divider />
                <InlineStack gap="300" blockAlign="center">
                  <Badge tone={RISK_BADGE_TONE[lookupResult.riskLevel]}>
                    {`${RISK_LABEL[lookupResult.riskLevel]} risk`}
                  </Badge>
                  <Text as="span" fontWeight="semibold">
                    {RISK_RECOMMENDATION[lookupResult.riskLevel]}
                  </Text>
                </InlineStack>
                {lookupResult.totalOrders > 0 ? (
                  <Text as="p" tone="subdued">
                    Delivery rate {lookupResult.deliveryRate?.toFixed(1)}% —{' '}
                    {lookupResult.deliveredCount ?? 0} delivered,{' '}
                    {lookupResult.rtoCount ?? 0} RTO across {lookupResult.totalOrders}{' '}
                    order{lookupResult.totalOrders === 1 ? '' : 's'}
                    {lookupResult.contributingStores
                      ? ` from ${lookupResult.contributingStores} store${lookupResult.contributingStores === 1 ? '' : 's'}`
                      : ''}
                    .
                  </Text>
                ) : (
                  <Text as="p" tone="subdued">
                    {lookupResult.message ?? 'No data yet for this number.'}
                  </Text>
                )}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
