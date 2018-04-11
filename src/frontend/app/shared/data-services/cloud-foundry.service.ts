import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { PaginationMonitor } from '../monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { AppState } from '../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../store/types/api.types';
import { EndpointModel } from '../../store/types/endpoint.types';

@Injectable()
export class CloudFoundryService {
  hasRegisteredCFEndpoints$: Observable<boolean>;
  hasConnectedCFEndpoints$: Observable<boolean>;
  connectedCFEndpoints$: Observable<EndpointModel[]>;
  cFEndpoints$: Observable<EndpointModel[]>;
  cfEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.cfEndpointsMonitor = this.paginationMonitorFactory.create(
      'endpoint-list',
      entityFactory(endpointSchemaKey)
    );

    this.cFEndpoints$ = this.cfEndpointsMonitor.currentPage$.pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === 'cf'))
    );

    this.connectedCFEndpoints$ = this.cFEndpoints$.pipe(
      map(endpoints => endpoints.filter(
        endpoint => endpoint.connectionStatus === 'connected' || endpoint.connectionStatus === 'checking'
      ))
    );

    this.hasConnectedCFEndpoints$ = this.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints.length)
    );

    this.hasRegisteredCFEndpoints$ = this.cFEndpoints$.pipe(
      map(endpoints => !!endpoints.length)
    );
  }
}
