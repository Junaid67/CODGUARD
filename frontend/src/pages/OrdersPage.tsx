import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Select,
  TextField,
  Badge,
  Banner,
  Spinner,
  Pagination,
  EmptyState,
  IndexTable,
  useIndexResourceState,
} from '@shopify/polaris';
import { listOrders, bulkMarkDelivered, bulkMarkRto } from '../api/orders';
import { getApiErrorMessage } from '../lib/api';
import { OrderOutcome, OrderRecord, PaginatedResponse, RiskLevel } from '../types/order';
import { RISK_BADGE_TONE, RISK_LABEL, RISK_RECOMMENDATION } from '../constants/risk';

const RISK_OPTIONS = [
  { label: 'All risk levels', value: '' },
  { label: 'Low', value: RiskLevel.LOW },
  { label: 'Medium', value: RiskLevel.MEDIUM },
  { label: 'High', value: RiskLevel.HIGH },
  { label: 'Unknown', value: RiskLevel.UNKNOWN },
];

const OUTCOME_OPTIONS = [
  { label: 'All outcomes', value: '' },
  { label: 'Pending', value: OrderOutcome.PENDING },
  { label: 'Delivered', value: OrderOutcome.DELIVERED },
  { label: 'RTO', value: OrderOutcome.RTO },
];

const LIMIT = 25;

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [riskLevel, setRiskLevel] = useState('');
  const [outcome, setOutcome] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [result, setResult] = useState<PaginatedResponse<OrderRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const orders = result?.data ?? [];
  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(orders as unknown as { [key: string]: unknown; id: string }[]);

  function fetchOrders() {
    setLoading(true);
    setError(null);
    listOrders({
      page,
      limit: LIMIT,
      riskLevel: (riskLevel as RiskLevel) || undefined,
      outcome: (outcome as OrderOutcome) || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setResult)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load orders')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, riskLevel, outcome, dateFrom, dateTo]);

  async function handleBulkAction(action: 'rto' | 'delivered') {
    setBulkActionLoading(true);
    setError(null);
    try {
      const ids = selectedResources;
      if (action === 'rto') await bulkMarkRto(ids);
      else await bulkMarkDelivered(ids);
      clearSelection();
      fetchOrders();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update the selected orders'));
    } finally {
      setBulkActionLoading(false);
    }
  }

  function resetFiltersAndPage(setter: () => void) {
    setter();
    setPage(1);
  }

  const promotedBulkActions = [
    {
      content: 'Mark as Delivered',
      onAction: () => handleBulkAction('delivered'),
    },
    {
      content: 'Mark as RTO',
      onAction: () => handleBulkAction('rto'),
    },
  ];

  const rowMarkup = orders.map((order, index) => (
    <IndexTable.Row
      id={order.id}
      key={order.id}
      selected={selectedResources.includes(order.id)}
      position={index}
    >
      <IndexTable.Cell>{order.orderNumber}</IndexTable.Cell>
      <IndexTable.Cell>{order.customerName ?? '—'}</IndexTable.Cell>
      <IndexTable.Cell>{order.phoneMasked ?? '—'}</IndexTable.Cell>
      <IndexTable.Cell>
        {order.deliveryRateAtOrderTime != null
          ? `${Math.round(order.deliveryRateAtOrderTime * 100)}%`
          : '—'}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={RISK_BADGE_TONE[order.riskLevel]}>{RISK_LABEL[order.riskLevel]}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{RISK_RECOMMENDATION[order.riskLevel]}</IndexTable.Cell>
      <IndexTable.Cell>{order.outcome}</IndexTable.Cell>
      <IndexTable.Cell>
        {order.shopifyCreatedAt ? new Date(order.shopifyCreatedAt).toLocaleDateString() : '—'}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Orders" subtitle="COD orders scored by customer delivery history">
      <BlockStack gap="400">
        {error && <Banner tone="critical">{error}</Banner>}

        <Card>
          <InlineStack gap="300" wrap>
            <div style={{ minWidth: 180 }}>
              <Select
                label="Risk level"
                options={RISK_OPTIONS}
                value={riskLevel}
                onChange={(value) => resetFiltersAndPage(() => setRiskLevel(value))}
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <Select
                label="Outcome"
                options={OUTCOME_OPTIONS}
                value={outcome}
                onChange={(value) => resetFiltersAndPage(() => setOutcome(value))}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <TextField
                label="From"
                type="date"
                value={dateFrom}
                onChange={(value) => resetFiltersAndPage(() => setDateFrom(value))}
                autoComplete="off"
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <TextField
                label="To"
                type="date"
                value={dateTo}
                onChange={(value) => resetFiltersAndPage(() => setDateTo(value))}
                autoComplete="off"
              />
            </div>
          </InlineStack>
        </Card>

        {loading && (
          <Card>
            <InlineStack gap="200" blockAlign="center">
              <Spinner size="small" />
              <Text as="span">Loading orders…</Text>
            </InlineStack>
          </Card>
        )}

        {!loading && result && orders.length === 0 && (
          <Card>
            <EmptyState
              heading="No orders yet"
              image=""
              action={undefined}
            >
              <Text as="p" tone="subdued">
                Orders will appear here once you complete onboarding and start receiving COD
                orders, or once they match your current filters.
              </Text>
            </EmptyState>
          </Card>
        )}

        {!loading && result && orders.length > 0 && (
          <Card padding="0">
            <IndexTable
              resourceName={{ singular: 'order', plural: 'orders' }}
              itemCount={orders.length}
              selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              promotedBulkActions={promotedBulkActions}
              loading={bulkActionLoading}
              headings={[
                { title: 'Order #' },
                { title: 'Customer' },
                { title: 'Phone' },
                { title: 'Delivery %' },
                { title: 'Risk level' },
                { title: 'Recommendation' },
                { title: 'Outcome' },
                { title: 'Date' },
              ]}
            >
              {rowMarkup}
            </IndexTable>

            <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                hasPrevious={page > 1}
                onPrevious={() => setPage((p) => p - 1)}
                hasNext={page < result.totalPages}
                onNext={() => setPage((p) => p + 1)}
                label={`Page ${result.page} of ${result.totalPages || 1} (${result.total} orders)`}
              />
            </div>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
