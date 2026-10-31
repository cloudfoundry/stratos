import type { SignalListColumn } from '@stratosui/core';
import type { StApp } from '../../../services/endpoint-data/stratos-types';

/** Format each label independently so filtering cannot match across label boundaries. */
export function appLabels(app: StApp): string[] {
  return Object.entries(app.labels ?? {}).map(([key, value]) => `${key}=${value}`);
}

export function renderAppLabels(app: StApp): string {
  return appLabels(app).join(', ') || '—';
}

// Cloud Foundry's label rules, in the order Cloud Controller checks them
// (app/messages/metadata_validator_helper.rb in cloud_controller_ng).
const MAX_NAME = 63;
const MAX_PREFIX = 253;
const INVALID_CHAR = /[^\w\-.]/;
const ALNUM_ENDS = /^(?=[a-zA-Z\d]).*[a-zA-Z\d]$/;
const DNS_NAME = /^(([a-z0-9]|[a-z0-9][a-z0-9-]{0,61}[a-z0-9])\.)+([a-z0-9]|[a-z0-9][a-z0-9-]{0,61}[a-z0-9])$/i;
const ALLOWED = 'may only use letters, digits, "-", "_" and "."';
const ENDS = 'must start and end with a letter or digit';

/**
 * Why Cloud Foundry would reject this label, or null when it would accept
 * it. Checked as the user adds a label, so a bad one never reaches the save.
 */
export function labelError(key: string, value: string): string | null {
  if (!key) return 'Label key cannot be empty.';
  if (key.split('/').length > 2) return 'Label key has more than one "/".';
  const slash = key.indexOf('/');
  const prefix = slash < 0 ? null : key.slice(0, slash);
  const name = slash < 0 ? key : key.slice(slash + 1);
  if (prefix !== null) {
    if (!DNS_NAME.test(prefix)) return `Label prefix "${prefix}" must be a DNS name, such as example.com.`;
    if (prefix.length > MAX_PREFIX) return `Label prefix is longer than ${MAX_PREFIX} characters.`;
    if (prefix.toLowerCase() === 'cloudfoundry.org') return 'Label prefix "cloudfoundry.org" is reserved.';
  }
  if (!name) return 'Label key cannot be empty.';
  if (INVALID_CHAR.test(name)) return `Label key "${name}" ${ALLOWED}.`;
  if (!ALNUM_ENDS.test(name)) return `Label key "${name}" ${ENDS}.`;
  if (name.length > MAX_NAME) return `Label key is longer than ${MAX_NAME} characters.`;
  if (!value) return null;
  if (INVALID_CHAR.test(value)) return `Label value "${value}" ${ALLOWED}.`;
  if (!ALNUM_ENDS.test(value)) return `Label value "${value}" ${ENDS}.`;
  if (value.length > MAX_NAME) return `Label value is longer than ${MAX_NAME} characters.`;
  return null;
}

/** The Labels column shared by every application list. */
export const appLabelsColumn: SignalListColumn<StApp> = {
  header: 'Labels', key: 'labels',
  render: renderAppLabels,
  widthHint: '12rem',
};
