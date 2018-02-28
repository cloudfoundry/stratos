import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { EntityService } from '../../../core/entity-service';
import { EndpointSchema } from '../../../store/actions/endpoint.actions';
import { Observable } from 'rxjs/Observable';
import { EntityInfo, APIResource } from '../../../store/types/api.types';
import { switchMap, shareReplay, tap, filter, map } from 'rxjs/operators';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { EndpointModel } from '../../../store/types/endpoint.types';

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
      EndpointSchema
    );

    this.kubeEndpoints$ = this.kubeEndpointsMonitor.currentPage$.pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === 'kubernetes')),
      shareReplay(1)
    );
  }
}
