import { BlockStack, Text, Button, Banner } from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { ConfirmScanResponse } from '../../types/onboarding';

interface Props {
  result: ConfirmScanResponse;
}

export function Step5Success({ result }: Props) {
  const navigate = useNavigate();

  return (
    <BlockStack gap="400">
      <Banner tone="success" title="Setup complete">
        Your store is ready — COD orders will now be scored by delivery-history risk.
      </Banner>

      <Text as="h2" variant="headingMd">
        Summary
      </Text>
      <Text as="p">
        {result.totalScanned} order{result.totalScanned === 1 ? '' : 's'} scanned,{' '}
        {result.rtoProcessed} RTO profile{result.rtoProcessed === 1 ? '' : 's'} created
        {result.excluded > 0 ? ` (${result.excluded} excluded by you)` : ''}.
      </Text>

      <Button variant="primary" onClick={() => navigate('/orders')}>
        Go to Dashboard
      </Button>
    </BlockStack>
  );
}
