import { useEffect, useMemo, useState } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Select,
  Checkbox,
  DataTable,
  Button,
  Banner,
  Spinner,
} from '@shopify/polaris';
import { ScanPreviewItem, ScanPreviewResponse } from '../../types/onboarding';
import { RtoSignal, RTO_SIGNAL_DEFINITIONS } from '../../types/rtoSignal';
import { previewScan } from '../../api/scan';
import { getApiErrorMessage } from '../../lib/api';

const DATE_RANGE_OPTIONS = [
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Last 6 months', value: '180' },
  { label: 'Last 12 months', value: '365' },
];

const signalLabel = (signal: RtoSignal) =>
  RTO_SIGNAL_DEFINITIONS.find((d) => d.signal === signal)?.label ?? signal;

interface Props {
  selectedSignals: RtoSignal[];
  dateRangeDays: number;
  excludedOrderIds: Set<string>;
  onChange: (dateRangeDays: number, excludedOrderIds: Set<string>, totalOrdersScanned: number) => void;
}

export function Step2ScanPreview({
  selectedSignals,
  dateRangeDays,
  excludedOrderIds,
  onChange,
}: Props) {
  const [preview, setPreview] = useState<ScanPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState<string>('ALL');

  useEffect(() => {
    setLoading(true);
    setError(null);
    previewScan(dateRangeDays)
      .then((res) => {
        setPreview(res);
        onChange(dateRangeDays, excludedOrderIds, res.totalOrdersScanned);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load scan preview')))
      .finally(() => setLoading(false));
    // Re-run only when the date range changes — excludedOrderIds is local UI state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeDays]);

  const items = preview?.items ?? [];

  const filteredItems = useMemo(() => {
    if (signalFilter === 'ALL') return items;
    return items.filter((item) => item.matchedSignals.includes(signalFilter as RtoSignal));
  }, [items, signalFilter]);

  function toggleRow(item: ScanPreviewItem, checked: boolean) {
    const next = new Set(excludedOrderIds);
    if (checked) next.delete(item.shopifyOrderId);
    else next.add(item.shopifyOrderId);
    onChange(dateRangeDays, next, preview?.totalOrdersScanned ?? 0);
  }

  function selectAll() {
    onChange(dateRangeDays, new Set(), preview?.totalOrdersScanned ?? 0);
  }

  function deselectAll() {
    onChange(dateRangeDays, new Set(items.map((i) => i.shopifyOrderId)), preview?.totalOrdersScanned ?? 0);
  }

  const signalFilterOptions = [
    { label: 'All signals', value: 'ALL' },
    ...selectedSignals.map((s) => ({ label: signalLabel(s), value: s })),
  ];

  const includedCount = items.length - [...excludedOrderIds].filter((id) =>
    items.some((i) => i.shopifyOrderId === id),
  ).length;

  const rows = filteredItems.map((item) => [
    <Checkbox
      key={item.shopifyOrderId}
      label=""
      labelHidden
      checked={!excludedOrderIds.has(item.shopifyOrderId)}
      onChange={(checked) => toggleRow(item, checked)}
    />,
    item.orderNumber,
    item.customerName ?? '—',
    item.phoneMasked ?? '—',
    item.matchedSignals.map(signalLabel).join(', '),
    item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—',
  ]);

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Review probable RTO orders
      </Text>
      <Text as="p" tone="subdued">
        We scanned your order history for the signals you selected. Uncheck any false positives
        before continuing.
      </Text>

      <InlineStack gap="300">
        <div style={{ minWidth: 200 }}>
          <Select
            label="Date range"
            options={DATE_RANGE_OPTIONS}
            value={String(dateRangeDays)}
            onChange={(value) => onChange(Number(value), new Set(), 0)}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <Select
            label="Filter by signal"
            options={signalFilterOptions}
            value={signalFilter}
            onChange={setSignalFilter}
          />
        </div>
      </InlineStack>

      {error && <Banner tone="critical">{error}</Banner>}

      {loading && (
        <InlineStack gap="200" blockAlign="center">
          <Spinner size="small" />
          <Text as="span">Scanning your order history…</Text>
        </InlineStack>
      )}

      {!loading && preview && (
        <>
          <InlineStack align="space-between" blockAlign="center">
            <Text as="p" fontWeight="semibold">
              {preview.probableRtoCount} probable RTO order
              {preview.probableRtoCount === 1 ? '' : 's'} found — {includedCount} selected
            </Text>
            <InlineStack gap="200">
              <Button onClick={selectAll}>Select all</Button>
              <Button onClick={deselectAll}>Deselect all</Button>
            </InlineStack>
          </InlineStack>

          {filteredItems.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={['Include', 'Order #', 'Customer', 'Phone', 'Signal detected', 'Date']}
              rows={rows}
            />
          ) : (
            <Banner tone="info">No orders match this filter.</Banner>
          )}
        </>
      )}
    </BlockStack>
  );
}
