import { SignalListCompoundSegment } from '@stratosui/core';

import type { StServiceInstance } from '../../services/endpoint-data/stratos-types';

// Shared "Attached Applications" cell over StServiceInstance.boundApps
// (the summary+ wire join). Restores the per-row bound-apps display the
// legacy cf-spaces-service-instances table cell provided — app names
// linking to the app pages, 'None' when unbound. Used by the services
// wall, the space service-instances tab, and the offering instances tab.

export function boundAppSegments(si: StServiceInstance): SignalListCompoundSegment[] {
  const apps = si.boundApps ?? [];
  if (apps.length === 0) return [{ text: 'None' }];
  return apps.map(a => ({
    text: a.name || a.guid,
    link: ['/applications', si.cnsiGuid, a.guid],
  }));
}

export function renderBoundApps(si: StServiceInstance): string {
  const apps = si.boundApps ?? [];
  return apps.length ? apps.map(a => a.name || a.guid).join(', ') : 'None';
}
