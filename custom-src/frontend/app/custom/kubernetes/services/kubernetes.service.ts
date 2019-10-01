import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { endpointSchemaKey, entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';

@Injectable()
export class KubernetesService {
  kubeEndpoints$: Observable<EndpointModel[]>;
  kubeEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor(
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.kubeEndpointsMonitor = this.paginationMonitorFactory.create(
      'endpoint-list', //TODO: RC check
      entityFactory(endpointSchemaKey)
    );

    this.kubeEndpoints$ = this.kubeEndpointsMonitor.currentPage$.pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === 'k8s')),
      shareReplay(1)
    );
  }
}
