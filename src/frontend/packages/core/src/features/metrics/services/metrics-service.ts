import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { METRICS_ENDPOINT_TYPE } from '../../../../../store/src/helpers/stratos-entity-factory';
import { PaginationMonitor } from '../../../../../store/src/monitors/pagination-monitor';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';

export interface MetricsEndpointProvider {
  provider: EndpointModel;
  /**
   * Convience property containiner unique endpoints that are related to this metric endpoint.
   * There may be multiple relations for the same endpoint (eirini + cf)
   */
  endpoints: EndpointModel[];
}

@Injectable()
export class MetricsService {
  metricsEndpoints$: Observable<MetricsEndpointProvider[]>;
  endpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;
  haveNoMetricsEndpoints$: Observable<boolean>;
  haveNoConnectedMetricsEndpoints$: Observable<boolean>;

  constructor() {
    this.endpointsMonitor = stratosEntityCatalog.endpoint.store.getPaginationMonitor();

    this.setupObservables();
  }

  private setupObservables() {
    this.metricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: EndpointModel[]) => {
        const result: MetricsEndpointProvider[] = [];
        const metrics = endpoints.filter(e => e.cnsi_type === METRICS_ENDPOINT_TYPE);
        metrics.forEach(ep => {

          const provider: MetricsEndpointProvider = {
            provider: ep,
            endpoints: [],
          };
          const providesMetricsFor = ep.relations ? ep.relations.provides : [];
          providesMetricsFor.forEach(relation => {
            if (provider.endpoints.find(e => e.guid === relation.guid)) {
              return;
            }
            const targetEndpoint = endpoints.find(e => e.guid === relation.guid);
            if (targetEndpoint) {
              provider.endpoints.push(targetEndpoint);
              targetEndpoint.metadata = targetEndpoint.metadata || {};
              targetEndpoint.metadata.fullApiEndpoint = getFullEndpointApiUrl(targetEndpoint);
            }
          });
          result.push(provider);
        });
        return result;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoMetricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const metrics = endpoints.filter(e => e.cnsi_type === METRICS_ENDPOINT_TYPE);
        return metrics.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoConnectedMetricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const metrics = endpoints.filter(e => e.cnsi_type === METRICS_ENDPOINT_TYPE);
        const connected = metrics.filter(e => !!e.user);
        return connected.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );
  }
}
