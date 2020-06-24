import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { endpointEntitySchema } from '../../../../store/src/base-entity-schemas';
import { PaginationMonitor } from '../../../../store/src/monitors/pagination-monitor';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { endpointListKey, EndpointModel } from '../../../../store/src/types/endpoint.types';

@Injectable()
export class CloudFoundryService {
  hasRegisteredCFEndpoints$: Observable<boolean>;
  hasConnectedCFEndpoints$: Observable<boolean>;
  connectedCFEndpoints$: Observable<EndpointModel[]>;
  cFEndpoints$: Observable<EndpointModel[]>;
  cfEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor(
    store: Store<CFAppState>
  ) {

    this.cfEndpointsMonitor = new PaginationMonitor(store, endpointListKey, endpointEntitySchema, true);

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

