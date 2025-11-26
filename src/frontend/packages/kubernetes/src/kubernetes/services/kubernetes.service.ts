import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import type { PaginationMonitor } from '../../../../store/src/monitors/pagination-monitor';
import type { EndpointModel } from '../../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';
import type { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { KUBERNETES_ENDPOINT_TYPE } from '../kubernetes-entity-factory';

@Injectable({
  providedIn: 'root'
})
export class KubernetesService {
  kubeEndpoints$: Observable<EndpointModel[]>;
  kubeEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor() {
    this.kubeEndpointsMonitor = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor();

    this.kubeEndpoints$ = this.kubeEndpointsMonitor.currentPage$.pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === KUBERNETES_ENDPOINT_TYPE)),
      shareReplay(1)
    );
  }
}
