import { useEffect, useState } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  Select,
  TextField,
  Button,
  Tag,
  Badge,
  Banner,
} from '@shopify/polaris';
import { RTO_SIGNAL_DEFINITIONS, RtoSignal } from '../../types/rtoSignal';
import { getTagSuggestions } from '../../api/onboarding';
import { getApiErrorMessage } from '../../lib/api';

interface Props {
  signals: RtoSignal[];
  tags: string[];
  courierAllowed: boolean;
  onChange: (signals: RtoSignal[], tags: string[]) => void;
}

export function Step1Signals({ signals, tags, courierAllowed, onChange }: Props) {
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagToAdd, setTagToAdd] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getTagSuggestions()
      .then(setTagSuggestions)
      .catch((err) => setLoadError(getApiErrorMessage(err, 'Could not load tag suggestions')));
  }, []);

  function toggleSignal(signal: RtoSignal, checked: boolean) {
    const next = checked ? [...signals, signal] : signals.filter((s) => s !== signal);
    onChange(next, tags);
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange(signals, [...tags, trimmed]);
  }

  function removeTag(tag: string) {
    onChange(signals, tags.filter((t) => t !== tag));
  }

  const tagSelectOptions = [
    { label: 'Select a tag…', value: '' },
    ...tagSuggestions.filter((t) => !tags.includes(t)).map((t) => ({ label: t, value: t })),
  ];

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Which signals indicate a return-to-origin (RTO)?
      </Text>
      <Text as="p" tone="subdued">
        Select at least one. We use these to detect probable RTO orders during the scan.
      </Text>

      <BlockStack gap="300">
        {RTO_SIGNAL_DEFINITIONS.map((def) => {
          const disabled = def.isCourier && !courierAllowed;
          return (
            <BlockStack key={def.signal} gap="100">
              <InlineStack gap="200" blockAlign="center">
                <Checkbox
                  label={def.label}
                  checked={signals.includes(def.signal)}
                  disabled={disabled}
                  onChange={(checked) => toggleSignal(def.signal, checked)}
                  helpText={def.description}
                />
                {disabled && <Badge tone="info">PRO plan required</Badge>}
              </InlineStack>
            </BlockStack>
          );
        })}
      </BlockStack>

      {signals.includes(RtoSignal.TAG) && (
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Which order tags mean RTO?
          </Text>

          {loadError && <Banner tone="warning">{loadError}</Banner>}

          <InlineStack gap="200" blockAlign="end">
            <div style={{ minWidth: 240 }}>
              <Select
                label="From your recent orders"
                options={tagSelectOptions}
                value={tagToAdd}
                onChange={(value) => {
                  setTagToAdd(value);
                  if (value) {
                    addTag(value);
                    setTagToAdd('');
                  }
                }}
              />
            </div>
          </InlineStack>

          <InlineStack gap="200" blockAlign="end">
            <div style={{ minWidth: 240 }}>
              <TextField
                label="Or add a custom tag"
                value={customTag}
                onChange={setCustomTag}
                autoComplete="off"
                placeholder="e.g. rto, returned, wapas"
              />
            </div>
            <Button
              onClick={() => {
                addTag(customTag);
                setCustomTag('');
              }}
              disabled={!customTag.trim()}
            >
              Add
            </Button>
          </InlineStack>

          {tags.length > 0 && (
            <InlineStack gap="200">
              {tags.map((tag) => (
                <Tag key={tag} onRemove={() => removeTag(tag)}>
                  {tag}
                </Tag>
              ))}
            </InlineStack>
          )}

          {tags.length === 0 && (
            <Text as="p" tone="subdued">
              Select at least one tag — required when the "Order tag" signal is enabled.
            </Text>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}
