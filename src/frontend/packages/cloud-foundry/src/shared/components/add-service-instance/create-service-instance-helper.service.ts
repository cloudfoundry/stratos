import { Signal, computed } from '@angular/core';

import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { StServiceInstance, StServiceOffering, StServicePlan } from '../../../services/endpoint-data/stratos-types';

/**
 * Per-(cfGuid, serviceGuid) facade that derives signal-driven views over
 * EndpointDataService's per-CNSI services-domain caches. Constructed and
 * cached by CreateServiceInstanceHelperServiceFactory. Readers that
 * compose with streams bridge the signals in their own injector.
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

  private endpointData: EndpointDataService;

  readonly serviceOffering: Signal<StServiceOffering | undefined>;
  readonly serviceName: Signal<string | undefined>;
  readonly servicePlans: Signal<StServicePlan[]>;

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
}
