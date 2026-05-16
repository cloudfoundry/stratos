import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { EndpointModel, EndpointsDataService } from '../../../../store/src/public-api';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { KUBERNETES_ENDPOINT_TYPE } from '../kubernetes-entity-factory';

@Injectable({
  providedIn: 'root'
})
export class KubernetesService {
  // W36-B Wave 3: source endpoints from EndpointsDataService instead
  // of the legacy ngrx PaginationMonitor.
  private endpointsData = inject(EndpointsDataService);

  kubeEndpoints$: Observable<EndpointModel[]>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;

  constructor() {
    this.kubeEndpoints$ = toObservable(this.endpointsData.endpointsList).pipe(
      map(endpoints => endpoints.filter(e => e.cnsi_type === KUBERNETES_ENDPOINT_TYPE)),
      shareReplay(1)
    );
  }
}
