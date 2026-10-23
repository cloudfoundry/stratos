import { EndpointModel } from '@stratosui/store';

// An endpoint type that needs no login (unConnectable, e.g. a Helm
// repository) has no connection status: it is usable as registered. What it
// can report is the sync status jetstream puts in endpoint_metadata.status.
// The endpoint card and the endpoints list both show it from here.
const SYNC_STATUS_LABELS: Record<string, string> = {
  Synchronized: 'Synchronized',
  Synchronizing: 'Synchronizing',
  Pending: 'Sync Pending',
  Failed: 'Synchronization failed',
};

/** Shown when such an endpoint reports no sync status. */
export const NO_SYNC_STATUS = '—';

/** The label for the endpoint's sync status, or null when it reports none. */
export function endpointSyncStatusLabel(ep: EndpointModel): string | null {
  const status = ep.endpoint_metadata?.status;
  return typeof status === 'string' ? SYNC_STATUS_LABELS[status] ?? null : null;
}

export function endpointSyncStatusColor(ep: EndpointModel): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (ep.endpoint_metadata?.status) {
    case 'Synchronized': return 'success';
    case 'Synchronizing':
    case 'Pending': return 'warning';
    case 'Failed': return 'danger';
    default: return 'neutral';
  }
}
