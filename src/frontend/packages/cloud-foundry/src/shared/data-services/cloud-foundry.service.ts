import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointsDataService } from '../../../../store/src/services/endpoints-data.service';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';

@Injectable({
  providedIn: 'root'
})
export class CloudFoundryService {
  // W36-B Wave 3: source endpoints from EndpointsDataService instead
  // of the legacy ngrx PaginationMonitor. The CF endpoint set was
  // never paginated server-side; the new service's endpointsList()
  // signal is the authoritative source.
  private endpointsData = inject(EndpointsDataService);

  hasRegisteredCFEndpoints$: Observable<boolean>;
  hasConnectedCFEndpoints$: Observable<boolean>;
  connectedCFEndpoints$: Observable<EndpointModel[]>;
  cFEndpoints$: Observable<EndpointModel[]>;
  waitForAppEntity$!: Observable<EntityInfo<APIResource>>;

  constructor() {
    const endpoints$ = toObservable(this.endpointsData.endpointsList);

    this.cFEndpoints$ = endpoints$.pipe(
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

