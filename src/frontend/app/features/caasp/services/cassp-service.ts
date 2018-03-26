import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, shareReplay } from 'rxjs/operators';

import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { EndpointModel } from '../../../store/types/endpoint.types';

@Injectable()
export class CaaspService {
  caaspEndpoints$: Observable<EndpointModel[]>;
  caaspEndpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.caaspEndpointsMonitor = this.paginationMonitorFactory.create(
      'endpoint-list',
      entityFactory(endpointSchemaKey)
    );

    this.caaspEndpoints$ = this.caaspEndpointsMonitor.currentPage$.pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === 'caasp')),
      shareReplay(1)
    );
  }
}
