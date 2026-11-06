import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  APIResource,
  EntityInfo,
  EndpointModel,
  EndpointsDataService,
  getFullEndpointApiUrl,
} from '@stratosui/store';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

export interface MetricsEndpointProvider {
  provider: EndpointModel;
  endpoints: EndpointModel[];
}

@Injectable()
export class MetricsService {
  // W36-B Wave 3: source endpoints from EndpointsDataService instead
  // of the legacy ngrx PaginationMonitor. The metrics endpoint set was
  // never paginated server-side; the new service's endpointsList()
  // signal is the authoritative source.
  private endpointsData = inject(EndpointsDataService);
  private endpoints$ = toObservable(this.endpointsData.endpointsList);

  metricsEndpoints$!: Observable<MetricsEndpointProvider[]>;
  waitForAppEntity$!: Observable<EntityInfo<APIResource>>;
  haveNoMetricsEndpoints$!: Observable<boolean>;
  haveNoConnectedMetricsEndpoints$!: Observable<boolean>;

  constructor() {
    this.setupObservables();
  }

  private setupObservables() {
    this.metricsEndpoints$ = this.endpoints$.pipe(
      map((endpoints: EndpointModel[]) => {
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
              (e as any).url = getFullEndpointApiUrl(e);
            }
          });
          result.push(provider);
        });
        return result;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoMetricsEndpoints$ = this.endpoints$.pipe(
      map((endpoints: EndpointModel[]) => {
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        return metrics.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoConnectedMetricsEndpoints$ = this.endpoints$.pipe(
      map((endpoints: EndpointModel[]) => {
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        const connected = metrics.filter(e => !!e.user);
        return connected.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );
  }
}
