import type { SignalListColumn } from '@stratosui/core';
import type { StApp } from '../../../services/endpoint-data/stratos-types';

/** Format each label independently so filtering cannot match across label boundaries. */
export function appLabels(app: StApp): string[] {
  return Object.entries(app.labels ?? {}).map(([key, value]) => `${key}=${value}`);
}

export function renderAppLabels(app: StApp): string {
  return appLabels(app).join(', ') || '—';
}

/** The Labels column shared by every application list. */
export const appLabelsColumn: SignalListColumn<StApp> = {
  header: 'Labels', key: 'labels',
  render: renderAppLabels,
  widthHint: '12rem',
};
