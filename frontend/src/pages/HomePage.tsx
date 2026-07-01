import { Page, Card, Text, BlockStack, Button, InlineStack } from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <Page title="COD Risk Scorer">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Welcome
          </Text>
          <Text as="p" tone="subdued">
            Score incoming COD orders by customer delivery history and decide
            whether to ship, confirm, or request a fee upfront.
          </Text>
          <InlineStack gap="300">
            <Button variant="primary" onClick={() => navigate('/onboarding')}>
              Start onboarding
            </Button>
            <Button onClick={() => navigate('/orders')}>View orders</Button>
          </InlineStack>
        </BlockStack>
      </Card>
    </Page>
  );
}
