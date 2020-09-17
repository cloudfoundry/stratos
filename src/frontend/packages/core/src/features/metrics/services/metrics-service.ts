import { Injectable } from '@angular/core';
import {
  APIResource,
  EntityInfo,
  EndpointModel,
  getFullEndpointApiUrl,
  PaginationMonitor,
  stratosEntityCatalog,
} from '@stratosui/store';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

export interface MetricsEndpointProvider {
  provider: EndpointModel;
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
    this.endpointsMonitor = stratosEntityCatalog.endpoint.store.getPaginationMonitor()

    this.setupObservables();
  }

  private setupObservables() {
    this.metricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const result: MetricsEndpointProvider[] = [];
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        metrics.forEach(ep => {
          const provider: MetricsEndpointProvider = {
            provider: ep,
            endpoints: [],
          };
          endpoints.forEach(e => {
            if (e.metadata && e.metadata.metrics && e.metadata.metrics === ep.guid) {
              provider.endpoints.push(e);
              e.url = getFullEndpointApiUrl(e);
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
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        return metrics.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoConnectedMetricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        const connected = metrics.filter(e => !!e.user);
        return connected.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );
  }
}
