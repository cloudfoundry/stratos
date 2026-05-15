import { Injector, computed, runInInjectionContext } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, startWith } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { AutoscalerInfoDataService } from '../../services/domain-data/autoscaler-info-data.service';
import { AutoscalerInfo } from '../../store/app-autoscaler.types';

// Wave-3 (A-effects-cleanup) — these helpers used to dispatch a
// GetAppAutoscalerInfoAction through ngrx and read back through an
// EntityService. They now route through AutoscalerInfoDataService
// (signal-native, plain HttpClient) so the cf-autoscaler package no
// longer ships any @ngrx imports. The legacy `(endpointGuid, esf)`
// signatures are preserved because the helpers are exported from the
// package's public_api and consumed by both the autoscaler-tab-extension
// (StratosTab.hidden, called from page-side-nav with framework-injected
// args) and the cloud-foundry summary card. The `esf` arg is retained
// for backwards compat but is unused — the data service is fetched via
// the module-level injector captured by CfAutoscalerPackageModule.

let helperInjector: Injector | null = null;

export function setAutoscalerHelperInjector(injector: Injector): void {
  helperInjector = injector;
}

function requireInjector(): Injector {
  if (!helperInjector) {
    throw new Error(
      'autoscaler-available helpers used before CfAutoscalerPackageModule was initialized',
    );
  }
  return helperInjector;
}

function getDataService(): AutoscalerInfoDataService {
  // AutoscalerInfoDataService is providedIn: 'root' so it resolves off
  // the captured root injector regardless of which feature module the
  // caller belongs to.
  return requireInjector().get(AutoscalerInfoDataService);
}

// Re-shape the data service's signal output into the
// EntityInfo<APIResource<AutoscalerInfo>> envelope the legacy effect path
// produced. Existing consumers (card-cf-info) read
// `.entityRequestInfo?.error` and `.entity?.entity?.build`, so we mint a
// minimal envelope that satisfies both reads.
function asEntityInfoObservable(
  svc: AutoscalerInfoDataService,
  endpointGuid: string,
): Observable<EntityInfo<APIResource<AutoscalerInfo>>> {
  const infoSig = svc.info(endpointGuid);
  const errorSig = svc.error(endpointGuid);
  const loadingSig = svc.loading(endpointGuid);
  const envelope = computed<EntityInfo<APIResource<AutoscalerInfo>>>(() => {
    const info = infoSig();
    const error = errorSig();
    return {
      entityRequestInfo: {
        fetching: loadingSig(),
        error: !!error,
        message: error,
      },
      entity: info
        ? { entity: info, metadata: { guid: endpointGuid } }
        : null,
    } as EntityInfo<APIResource<AutoscalerInfo>>;
  });
  return runInInjectionContext(requireInjector(), () => toObservable(envelope));
}

export const fetchAutoscalerInfo = (
  endpointGuid: string,
  _esf?: EntityServiceFactory,
): Observable<EntityInfo<APIResource<AutoscalerInfo>>> => {
  const svc = getDataService();
  void svc.load(endpointGuid);
  return asEntityInfoObservable(svc, endpointGuid);
};

/**
 * Checks if autoscaler is enabled/available for the given endpoint.
 * Returns true only if autoscaler is configured and accessible.
 * Returns false if autoscaler URL is missing or service is unavailable.
 */
export const isAutoscalerEnabled = (
  endpointGuid: string,
  _esf?: EntityServiceFactory,
): Observable<boolean> => {
  const svc = getDataService();
  void svc.load(endpointGuid);
  return runInInjectionContext(requireInjector(), () =>
    toObservable(svc.isAvailable(endpointGuid)),
  ).pipe(
    distinctUntilChanged(),
    map(value => !!value),
    catchError(() => of(false)),
    startWith(false),
  );
};
