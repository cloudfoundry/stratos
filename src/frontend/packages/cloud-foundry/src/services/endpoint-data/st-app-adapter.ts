import { APIResource } from '@stratosui/store';

import { IApp } from '../../cf-api.types';
import { StApp } from './stratos-types';

// Adapter from V3-native StApp (signal-native EndpointDataService shape) to
// the legacy APIResource<IApp> envelope expected by V2-era consumers
// (CardCfRecentAppsComponent template, OrgQuotaHelper, getMetricFromApps,
// appDataSort, etc.). Keeps the v2 wire-shape contract alive at consumer
// boundaries without round-tripping through the ngrx pagination cache —
// the legacy /pp/v1/cf/apps?per_page=100 fetch dies, the v2-shape API
// surface stays.
//
// Only the fields actually read across the consumer set are populated:
//   metadata.guid, metadata.updated_at  — appDataSort, trackByAppGuid
//   entity.state                         — appsPagObs filter, fetchAppStats
//   entity.memory, entity.instances      — getMetricFromApps total
//   entity.space_guid                    — getAppsInSpaceViaAllApps filter
//   entity.name                          — recent-apps card display
//   entity.package_state                 — application-state-icon lens
//
// package_state defaults to 'STAGED' — V3 doesn't carry the v2 "package state"
// concept (the equivalent droplet state isn't fetched in this path). Without
// it, ApplicationStateService.get() falls through every branch in the state
// table and returns Unknown/ERROR, which renders as a red "cancel" lens on
// every recent-apps card row regardless of actual app health. Defaulting to
// STAGED matches the cfhome-card adapter (same intent) and lets the live
// state lookup proceed off `state` + the per-app stats fetch.
export function stAppToAPIResource(app: StApp): APIResource<IApp> {
  return {
    metadata: {
      guid: app.guid,
      url: '',
      created_at: app.createdAt,
      updated_at: app.updatedAt,
    },
    entity: {
      guid: app.guid,
      name: app.name,
      state: app.state,
      space_guid: app.spaceGuid,
      memory: app.memory ?? 0,
      disk_quota: app.diskQuota ?? 0,
      instances: app.instances,
      cfGuid: app.cnsiGuid,
      package_state: 'STAGED',
    } as IApp,
  };
}
