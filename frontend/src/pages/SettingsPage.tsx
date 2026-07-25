import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Select,
  Button,
  Banner,
  Spinner,
  ButtonGroup,
} from '@shopify/polaris';
import { Step1Signals } from './onboarding/Step1Signals';
import { RtoSignal } from '../types/rtoSignal';
import { StoreSettings } from '../types/store';
import { OrderRecord } from '../types/order';
import { getStoreSettings, updateStoreSettings } from '../api/store';
import { rescan } from '../api/scan';
import { listManualRto, addManualRto, removeManualRto } from '../api/orders';
import { getApiErrorMessage } from '../lib/api';

const DATE_RANGE_OPTIONS = [
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Last 6 months', value: '180' },
  { label: 'Last 12 months', value: '365' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [signals, setSignals] = useState<RtoSignal[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [noteKeywords, setNoteKeywords] = useState<string[]>([]);
  const [savingSignals, setSavingSignals] = useState(false);
  const [signalsBanner, setSignalsBanner] = useState<{ tone: 'success' | 'critical'; message: string } | null>(null);

  const [rescanRangeDays, setRescanRangeDays] = useState('180');
  const [rescanning, setRescanning] = useState(false);
  const [rescanBanner, setRescanBanner] = useState<{ tone: 'success' | 'critical'; message: string } | null>(null);

  const [manualEntries, setManualEntries] = useState<OrderRecord[]>([]);
  const [manualPhone, setManualPhone] = useState('');
  const [addingManual, setAddingManual] = useState(false);
  const [manualBanner, setManualBanner] = useState<{ tone: 'success' | 'critical'; message: string } | null>(null);

  useEffect(() => {
    Promise.all([getStoreSettings(), listManualRto()])
      .then(([storeSettings, manual]) => {
        setSettings(storeSettings);
        setSignals(storeSettings.rtoSignals);
        setTags(storeSettings.rtoTags);
        setNoteKeywords(storeSettings.rtoNoteKeywords ?? []);
        setManualEntries(manual);
      })
      .catch((err) => setLoadError(getApiErrorMessage(err, 'Could not load settings')))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveSignals() {
    setSavingSignals(true);
    setSignalsBanner(null);
    try {
      const updated = await updateStoreSettings(signals, tags, noteKeywords);
      setSettings(updated);
      setSignalsBanner({ tone: 'success', message: 'RTO detection settings saved.' });
    } catch (err) {
      setSignalsBanner({ tone: 'critical', message: getApiErrorMessage(err, 'Could not save settings') });
    } finally {
      setSavingSignals(false);
    }
  }

  async function handleRescan() {
    setRescanning(true);
    setRescanBanner(null);
    try {
      const result = await rescan(Number(rescanRangeDays));
      const updated = await getStoreSettings();
      setSettings(updated);
      setRescanBanner({
        tone: 'success',
        message: `Re-scan complete — ${result.totalScanned} orders scanned, ${result.rtoProcessed} RTOs processed.`,
      });
    } catch (err) {
      setRescanBanner({ tone: 'critical', message: getApiErrorMessage(err, 'Could not run re-scan') });
    } finally {
      setRescanning(false);
    }
  }

  async function handleAddManual() {
    const phone = manualPhone.trim();
    if (!phone) return;
    setAddingManual(true);
    setManualBanner(null);
    try {
      const entry = await addManualRto(phone);
      setManualEntries((prev) => [entry, ...prev]);
      setManualPhone('');
    } catch (err) {
      setManualBanner({ tone: 'critical', message: getApiErrorMessage(err, 'Could not add this number') });
    } finally {
      setAddingManual(false);
    }
  }

  async function handleRemoveManual(id: string) {
    try {
      await removeManualRto(id);
      setManualEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setManualBanner({ tone: 'critical', message: getApiErrorMessage(err, 'Could not remove this number') });
    }
  }

  if (loading) {
    return (
      <Page title="Settings">
        <Card>
          <InlineStack gap="200" blockAlign="center">
            <Spinner size="small" />
            <Text as="span">Loading settings…</Text>
          </InlineStack>
        </Card>
      </Page>
    );
  }

  if (loadError || !settings) {
    return (
      <Page title="Settings">
        <Banner tone="critical">{loadError ?? 'Could not load settings'}</Banner>
      </Page>
    );
  }

  const canRescan = settings.features.rescan;

  return (
    <Page title="Settings">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            {signalsBanner && <Banner tone={signalsBanner.tone}>{signalsBanner.message}</Banner>}
            <Step1Signals
              signals={signals}
              tags={tags}
              noteKeywords={noteKeywords}
              courierAllowed={settings.features.courierIntegration}
              onChange={(nextSignals, nextTags, nextKeywords) => {
                setSignals(nextSignals);
                setTags(nextTags);
                setNoteKeywords(nextKeywords);
              }}
            />
            <InlineStack align="end">
              <Button variant="primary" loading={savingSignals} onClick={handleSaveSignals}>
                Save changes
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Re-scan historical orders
            </Text>
            <Text as="p" tone="subdued">
              Last scan: {settings.lastScanAt ? new Date(settings.lastScanAt).toLocaleString() : 'Never'} —{' '}
              {settings.totalOrdersScanned} order{settings.totalOrdersScanned === 1 ? '' : 's'} scanned in total.
            </Text>

            {!canRescan && (
              <Banner tone="info">Re-scanning is available on the GROWTH and PRO plans.</Banner>
            )}

            {rescanBanner && <Banner tone={rescanBanner.tone}>{rescanBanner.message}</Banner>}

            <InlineStack gap="300" blockAlign="end">
              <div style={{ minWidth: 200 }}>
                <Select
                  label="Date range"
                  options={DATE_RANGE_OPTIONS}
                  value={rescanRangeDays}
                  onChange={setRescanRangeDays}
                  disabled={!canRescan}
                />
              </div>
              <Button onClick={handleRescan} loading={rescanning} disabled={!canRescan}>
                Run scan again
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Manual RTO
            </Text>
            <Text as="p" tone="subdued">
              Flag a phone number as RTO directly, without a matching order.
            </Text>

            {manualBanner && <Banner tone={manualBanner.tone}>{manualBanner.message}</Banner>}

            <InlineStack gap="200" blockAlign="end">
              <div style={{ minWidth: 240 }}>
                <TextField
                  label="Phone number"
                  labelHidden
                  placeholder="03001234567"
                  value={manualPhone}
                  onChange={setManualPhone}
                  autoComplete="off"
                />
              </div>
              <Button onClick={handleAddManual} loading={addingManual} disabled={!manualPhone.trim()}>
                Add
              </Button>
            </InlineStack>

            {manualEntries.length === 0 ? (
              <Text as="p" tone="subdued">
                No manually-added numbers yet.
              </Text>
            ) : (
              <BlockStack gap="200">
                {manualEntries.map((entry) => (
                  <InlineStack key={entry.id} align="space-between" blockAlign="center">
                    <Text as="span">{entry.phoneMasked ?? '—'}</Text>
                    <ButtonGroup>
                      <Button variant="plain" tone="critical" onClick={() => handleRemoveManual(entry.id)}>
                        Remove
                      </Button>
                    </ButtonGroup>
                  </InlineStack>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
