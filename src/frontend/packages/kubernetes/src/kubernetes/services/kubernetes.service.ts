import { Injectable, Signal, computed, inject } from '@angular/core';

import { EndpointModel, EndpointsDataService } from '../../../../store/src/public-api';
import { KUBERNETES_ENDPOINT_TYPE } from '../kubernetes-entity-factory';

@Injectable({
  providedIn: 'root'
})
export class KubernetesService {
  // W36-B Wave 3: source endpoints from EndpointsDataService instead
  // of the legacy ngrx PaginationMonitor.
  private endpointsData = inject(EndpointsDataService);

  readonly kubeEndpoints: Signal<EndpointModel[]> = computed(() =>
    this.endpointsData.endpointsList().filter(e => e.cnsi_type === KUBERNETES_ENDPOINT_TYPE)
  );

  // strict: structural-shape field mirroring the sibling endpoint services
  // (metrics-service / cloud-foundry.service); populated by consumers, never
  // initialized here. Matches the existing definite-assignment convention.
}
