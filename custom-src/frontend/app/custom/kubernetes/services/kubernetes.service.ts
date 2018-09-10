import { Injectable } from '@angular/core';

import { Store } from '@ngrx/store';

import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { EndpointModel } from '../../../store/types/endpoint.types';

import { map, shareReplay, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class KubernetesService {
  kubeEndpoints$: Observable<EndpointModel[]>;
  kubeEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.kubeEndpointsMonitor = this.paginationMonitorFactory.create(
      'endpoint-list',
      entityFactory(endpointSchemaKey)
    );

    this.kubeEndpoints$ = this.kubeEndpointsMonitor.currentPage$.pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === 'k8s')),
      shareReplay(1)
    );
  }
}
