import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { PaginationMonitor } from '../../../../store/src/monitors/pagination-monitor';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';
import type { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import type { EndpointModel } from '../../../../store/src/types/endpoint.types';

@Injectable({
  providedIn: 'root'
})
export class CloudFoundryService {
  hasRegisteredCFEndpoints$: Observable<boolean>;
  hasConnectedCFEndpoints$: Observable<boolean>;
  connectedCFEndpoints$: Observable<EndpointModel[]>;
  cFEndpoints$: Observable<EndpointModel[]>;
  cfEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$!: Observable<EntityInfo<APIResource>>;

  constructor() {

    this.cfEndpointsMonitor = stratosEntityCatalog.endpoint.store.getPaginationMonitor();

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

