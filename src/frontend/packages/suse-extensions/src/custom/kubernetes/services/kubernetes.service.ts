import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { endpointEntityType, stratosEntityFactory } from '../../../../../store/src/helpers/stratos-entity-factory';
import { PaginationMonitor } from '../../../../../store/src/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { endpointListKey, EndpointModel } from '../../../../../store/src/types/endpoint.types';

@Injectable()
export class KubernetesService {
  kubeEndpoints$: Observable<EndpointModel[]>;
  kubeEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor(
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    // TODO: RC update with stratos entity catalog
    this.kubeEndpointsMonitor = this.paginationMonitorFactory.create(
      endpointListKey,
      stratosEntityFactory(endpointEntityType),
      true
    );

    this.kubeEndpoints$ = this.kubeEndpointsMonitor.currentPage$.pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === 'k8s')),
      shareReplay(1)
    );
  }
}
