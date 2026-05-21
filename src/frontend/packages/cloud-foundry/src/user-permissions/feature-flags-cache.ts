import { HttpClient } from '@angular/common/http';

import { CnsiFeatureFlagsSource } from '../services/data-sources/cnsi-feature-flags-source';

// Process-wide cache of CnsiFeatureFlagsSource keyed by CF endpoint guid.
// Two consumers (cfUserRolesFetch — a plain function called from store-side
// effects with no Injector, and CfUserPermissionsChecker — an Injectable)
// share this so the FF list is fetched once per CF endpoint per session.
// CnsiFeatureFlagsSource is signal-bearing; consumers either await load()
// for completion-gating or read items() / toObservable(items) for data.
const cache = new Map<string, CnsiFeatureFlagsSource>();

export function getFeatureFlagsSource(
  cnsiGuid: string,
  http: HttpClient,
): CnsiFeatureFlagsSource {
  let src = cache.get(cnsiGuid);
  if (!src) {
    src = new CnsiFeatureFlagsSource(cnsiGuid, http);
    cache.set(cnsiGuid, src);
  }
  return src;
}
