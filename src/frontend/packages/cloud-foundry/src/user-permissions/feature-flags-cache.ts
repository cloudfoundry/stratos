import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { CnsiFeatureFlagsSource } from '../services/data-sources/cnsi-feature-flags-source';
import type { StFeatureFlag } from '../services/endpoint-data/stratos-types';

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

// Defers building the feature-flags items stream until load() resolves. The
// source's items signal starts empty and fills asynchronously; permission
// checks that take(1) would otherwise capture the pre-load empty list and
// resolve to a false negative (e.g. set/unset-roles-by-username appearing
// disabled even though the flag is enabled).
//
// The stream is built via a factory invoked AFTER load() completes — not a
// pre-built observable. This matters for toObservable(signal): if created
// while items is still empty it buffers that empty value in its replay and
// emits it first regardless of subscription timing. Building it post-load
// means its first emission reflects the populated signal.
export function featureFlagsAfterLoad$(
  load: () => Promise<void>,
  itemsFactory: () => Observable<StFeatureFlag[]>,
): Observable<StFeatureFlag[]> {
  return from(load()).pipe(switchMap(() => itemsFactory()));
}
