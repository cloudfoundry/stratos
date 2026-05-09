import { Injector, Signal, computed, inject, runInInjectionContext } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { StServiceInstance, StServiceOffering, StServicePlan } from '../../../services/endpoint-data/stratos-types';

/**
 * Per-(cfGuid, serviceGuid) facade that derives signal-driven views over
 * EndpointDataService's per-CNSI services-domain caches. Constructed via
 * CreateServiceInstanceHelperServiceFactory which provides an injection
 * context so the helper can use toObservable() on its derived signals
 * for legacy RxJS-pipe consumers.
 *
 * Loads happen lazily on construction via loadServicesDetails() —
 * idempotent (warm-cache short-circuit). Filtering by the configured
 * serviceGuid happens in computed() projections so consumers update
 * reactively as the cache is populated.
 *
 * Replaces the legacy ngrx-driven helper (cfEntityCatalog +
 * paginationMonitor + entity-relations + APIResource shapes).
 */
export class CreateServiceInstanceHelper {
  marketPlaceMode = false;

  // The factory wraps construction in runInInjectionContext, so inject()
  // here resolves the surrounding injector for use with later toObservable
  // calls (e.g. serviceInstances$ which is computed-per-call).
  private readonly injector = inject(Injector);

  private endpointData: EndpointDataService;

  readonly serviceOffering: Signal<StServiceOffering | undefined>;
  readonly serviceName: Signal<string | undefined>;
  readonly servicePlans: Signal<StServicePlan[]>;

  // toObservable bridges for legacy RxJS-pipe consumers. Created in the
  // helper constructor — the factory wraps construction in
  // runInInjectionContext so these are valid here.
  readonly servicePlans$: Observable<StServicePlan[]>;
  readonly serviceName$: Observable<string | undefined>;

  constructor(
    public readonly serviceGuid: string,
    public readonly cfGuid: string,
    registry: EndpointDataRegistry,
  ) {
    if (!serviceGuid) {
      throw new Error('CreateServiceInstanceHelper requires a valid serviceGuid');
    }
    if (!cfGuid) {
      throw new Error('CreateServiceInstanceHelper requires a valid cfGuid');
    }

    this.endpointData = registry.acquire(cfGuid);
    // Loads are explicit — call helper.load() from the orchestrator on
    // stepper entry. Auto-load on construction would fire HTTP from spec
    // contexts that haven't mocked the services endpoints.

    this.serviceOffering = computed(() =>
      this.endpointData.serviceOfferings().find(o => o.guid === this.serviceGuid),
    );
    this.serviceName = computed(() => this.serviceOffering()?.name);
    this.servicePlans = computed(() =>
      this.endpointData.servicePlans().filter(p => p.serviceOffering?.guid === this.serviceGuid),
    );

    this.servicePlans$ = toObservable(this.servicePlans);
    this.serviceName$ = toObservable(this.serviceName);
  }

  /**
   * Trigger the per-CNSI services load. Idempotent (warm-cache short-
   * circuit on the underlying EndpointDataService). Call once when the
   * stepper opens; safe to call again on re-entry.
   */
  load(): Promise<void> {
    return this.endpointData.loadServicesDetails();
  }

  /**
   * Filtered service-instances signal. Both filters are optional:
   *  - planGuid:  return only instances bound to this plan
   *  - spaceGuid: return only instances in this space
   * No filters → all instances cached for the cnsi.
   */
  serviceInstances(planGuid?: string | null, spaceGuid?: string | null): Signal<StServiceInstance[]> {
    return computed(() => {
      let list = this.endpointData.serviceInstances();
      if (planGuid) {
        list = list.filter(si => si.servicePlan?.guid === planGuid);
      }
      if (spaceGuid) {
        list = list.filter(si => si.space?.guid === spaceGuid);
      }
      return list;
    });
  }

  /**
   * Observable bridge for serviceInstances() — for legacy RxJS-pipe consumers.
   * Wraps the toObservable call in the captured injector so callers don't
   * need to be in an injection context.
   */
  serviceInstances$(planGuid?: string | null, spaceGuid?: string | null): Observable<StServiceInstance[]> {
    return runInInjectionContext(this.injector, () => toObservable(this.serviceInstances(planGuid, spaceGuid)));
  }
}
