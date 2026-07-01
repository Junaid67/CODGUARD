import { useEffect, useRef, useState } from 'react';
import { BlockStack, Text, ProgressBar, Banner, Button } from '@shopify/polaris';
import { confirmScan } from '../../api/scan';
import { getApiErrorMessage } from '../../lib/api';
import { ConfirmScanResponse } from '../../types/onboarding';

const STAGES = [
  'Phone numbers extracted',
  'RTOs calculated',
  'Risk profiles created',
  'Store ready',
];

interface Props {
  totalOrdersScanned: number;
  excludedOrderIds: Set<string>;
  dateRangeDays: number;
  onComplete: (result: ConfirmScanResponse) => void;
}

export function Step4Processing({
  totalOrdersScanned,
  excludedOrderIds,
  dateRangeDays,
  onComplete,
}: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Cycle through the stage labels while the confirm call is in flight —
    // this is a real backend call (Bulk Operations + scoring), so its actual
    // duration doesn't map to discrete stages; the ticker just gives feedback.
    const ticker = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 1200);

    confirmScan(Array.from(excludedOrderIds), dateRangeDays)
      .then((result) => {
        clearInterval(ticker);
        setStageIndex(STAGES.length - 1);
        onComplete(result);
      })
      .catch((err) => {
        clearInterval(ticker);
        setError(getApiErrorMessage(err, 'Could not complete the scan'));
      });

    return () => clearInterval(ticker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <BlockStack gap="400">
        <Banner tone="critical" title="Setup failed">
          {error}
        </Banner>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </BlockStack>
    );
  }

  const progress = Math.round(((stageIndex + 1) / STAGES.length) * 100);

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Setting up your store
      </Text>
      <Text as="p" tone="subdued">
        Processing {totalOrdersScanned} order{totalOrdersScanned === 1 ? '' : 's'}…
      </Text>
      <ProgressBar progress={progress} size="small" />
      <BlockStack gap="100">
        {STAGES.map((stage, i) => (
          <Text key={stage} as="p" tone={i <= stageIndex ? undefined : 'subdued'}>
            {i < stageIndex ? '✓' : i === stageIndex ? '…' : '○'} {stage}
          </Text>
        ))}
      </BlockStack>
    </BlockStack>
  );
}
