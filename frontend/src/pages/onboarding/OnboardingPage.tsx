import { useEffect, useState } from 'react';
import { Page, Card, BlockStack, InlineStack, Button, ProgressBar, Text, Banner, Spinner } from '@shopify/polaris';
import { Step1Signals } from './Step1Signals';
import { Step2ScanPreview } from './Step2ScanPreview';
import { Step3Terms } from './Step3Terms';
import { Step4Processing } from './Step4Processing';
import { Step5Success } from './Step5Success';
import { RtoSignal } from '../../types/rtoSignal';
import { ConfirmScanResponse, OnboardingStep } from '../../types/onboarding';
import { acceptTerms, getOnboardingStatus, saveRtoSignals } from '../../api/onboarding';
import { getStoreSettings } from '../../api/store';
import { getApiErrorMessage } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const STEP_LABELS = ['Signals', 'Review', 'Terms', 'Processing', 'Done'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courierAllowed, setCourierAllowed] = useState(false);

  const [signals, setSignals] = useState<RtoSignal[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [dateRangeDays, setDateRangeDays] = useState(180);
  const [excludedOrderIds, setExcludedOrderIds] = useState<Set<string>>(new Set());
  const [totalOrdersScanned, setTotalOrdersScanned] = useState(0);

  const [confirmed, setConfirmed] = useState(false);
  const [signalsAccurate, setSignalsAccurate] = useState(false);

  const [confirmResult, setConfirmResult] = useState<ConfirmScanResponse | null>(null);

  useEffect(() => {
    Promise.all([getOnboardingStatus(), getStoreSettings()])
      .then(([status, settings]) => {
        setCourierAllowed(settings.features.courierIntegration);
        setSignals(settings.rtoSignals ?? []);
        setTags(settings.rtoTags ?? []);

        if (status.nextStep === OnboardingStep.COMPLETE) {
          navigate('/orders', { replace: true });
          return;
        }
        // TERMS/CONFIRM_SCAN resume at step 2 — scan preview is re-run client
        // side since selections (excluded orders) aren't persisted server-side.
        setStep(status.nextStep === OnboardingStep.SIGNALS ? 1 : 2);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load onboarding status')))
      .finally(() => setLoadingInitial(false));
  }, [navigate]);

  async function handleSignalsNext() {
    setSubmitting(true);
    setError(null);
    try {
      await saveRtoSignals({ signals, tags });
      setStep(2);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save your signals'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTermsConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await acceptTerms({ confirmed, signalsAccurate });
      setStep(4);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not accept terms'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) {
    return (
      <Page title="Onboarding">
        <Card>
          <InlineStack gap="200" blockAlign="center">
            <Spinner size="small" />
            <Text as="span">Loading…</Text>
          </InlineStack>
        </Card>
      </Page>
    );
  }

  const tagSignalRequiresTags = signals.includes(RtoSignal.TAG) && tags.length === 0;
  const canProceedStep1 = signals.length > 0 && !tagSignalRequiresTags;

  return (
    <Page title="Onboarding" subtitle={`Step ${step} of 5: ${STEP_LABELS[step - 1]}`}>
      <BlockStack gap="400">
        <ProgressBar progress={(step / 5) * 100} size="small" />

        {error && <Banner tone="critical">{error}</Banner>}

        <Card>
          {step === 1 && (
            <Step1Signals
              signals={signals}
              tags={tags}
              courierAllowed={courierAllowed}
              onChange={(s, t) => {
                setSignals(s);
                setTags(t);
              }}
            />
          )}

          {step === 2 && (
            <Step2ScanPreview
              selectedSignals={signals}
              dateRangeDays={dateRangeDays}
              excludedOrderIds={excludedOrderIds}
              onChange={(range, excluded, total) => {
                setDateRangeDays(range);
                setExcludedOrderIds(excluded);
                setTotalOrdersScanned(total);
              }}
            />
          )}

          {step === 3 && (
            <Step3Terms
              confirmed={confirmed}
              signalsAccurate={signalsAccurate}
              onChange={(c, s) => {
                setConfirmed(c);
                setSignalsAccurate(s);
              }}
            />
          )}

          {step === 4 && (
            <Step4Processing
              totalOrdersScanned={totalOrdersScanned}
              excludedOrderIds={excludedOrderIds}
              dateRangeDays={dateRangeDays}
              onComplete={(result) => {
                setConfirmResult(result);
                setStep(5);
              }}
            />
          )}

          {step === 5 && confirmResult && <Step5Success result={confirmResult} />}
        </Card>

        {step < 4 && (
          <InlineStack align="end" gap="200">
            {step > 1 && (
              <Button onClick={() => setStep(step - 1)} disabled={submitting}>
                Back
              </Button>
            )}
            {step === 1 && (
              <Button
                variant="primary"
                onClick={handleSignalsNext}
                disabled={!canProceedStep1}
                loading={submitting}
              >
                Next
              </Button>
            )}
            {step === 2 && (
              <Button variant="primary" onClick={() => setStep(3)}>
                Next
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="primary"
                onClick={handleTermsConfirm}
                disabled={!confirmed || !signalsAccurate}
                loading={submitting}
              >
                Confirm
              </Button>
            )}
          </InlineStack>
        )}
      </BlockStack>
    </Page>
  );
}
