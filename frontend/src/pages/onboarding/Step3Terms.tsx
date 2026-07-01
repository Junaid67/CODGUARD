import { BlockStack, Text, Checkbox, Card, List } from '@shopify/polaris';

interface Props {
  confirmed: boolean;
  signalsAccurate: boolean;
  onChange: (confirmed: boolean, signalsAccurate: boolean) => void;
}

export function Step3Terms({ confirmed, signalsAccurate, onChange }: Props) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Terms before we scan your store
      </Text>

      <Card background="bg-surface-secondary">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Data accuracy
          </Text>
          <Text as="p" tone="subdued">
            RTO detection is based on the signals you selected (order status, tags, or courier
            data). It is an estimate, not a guarantee — orders can be misclassified if your store's
            tagging or fulfillment data is incomplete or inconsistent.
          </Text>

          <Text as="h3" variant="headingSm">
            Customer risk profiles
          </Text>
          <Text as="p" tone="subdued">
            We build a delivery-history risk profile per customer phone number, based on past
            order outcomes (delivered vs. returned) across the stores using this app.
          </Text>

          <Text as="h3" variant="headingSm">
            Cross-store data sharing
          </Text>
          <Text as="p" tone="subdued">
            Risk profiles are aggregated anonymously across all stores using this app — no store
            can see another store's raw order or customer data, only the resulting risk score for
            a phone number.
          </Text>

          <Text as="h3" variant="headingSm">
            Responsibility for incorrect data
          </Text>
          <List type="bullet">
            <List.Item>
              You are responsible for the accuracy of the RTO signals you configure.
            </List.Item>
            <List.Item>
              We are not liable for business decisions made based on a risk score derived from
              your selected signals.
            </List.Item>
            <List.Item>
              You can correct misclassified orders at any time from the orders dashboard.
            </List.Item>
          </List>
        </BlockStack>
      </Card>

      <BlockStack gap="200">
        <Checkbox
          label="I have read and understood the above"
          checked={confirmed}
          onChange={(checked) => onChange(checked, signalsAccurate)}
        />
        <Checkbox
          label="I confirm my selected signals are accurate"
          checked={signalsAccurate}
          onChange={(checked) => onChange(confirmed, checked)}
        />
      </BlockStack>
    </BlockStack>
  );
}
