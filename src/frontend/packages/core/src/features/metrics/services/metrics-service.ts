import { Injectable, Signal, computed, inject } from '@angular/core';
import {
  EndpointModel,
  EndpointsDataService,
} from '@stratosui/store';

export interface MetricsEndpointProvider {
  provider: EndpointModel;
  endpoints: EndpointModel[];
}

// App-wide, as MetricsModule (imported by the dashboard) provided it before
// the NgModule removal: the metrics endpoint page and the Metrics endpoint
// card details both inject it, outside any component that provides it.
@Injectable({ providedIn: 'root' })
export class MetricsService {
  private endpointsData = inject(EndpointsDataService);

  // The metrics endpoints, each with the endpoints it provides metrics for.
  readonly metricsEndpoints: Signal<MetricsEndpointProvider[]> = computed(() => {
    const endpoints = this.endpointsData.endpointsList();
    return endpoints.filter(e => e.cnsi_type === 'metrics').map(provider => ({
      provider,
      endpoints: endpoints.filter(e => !!e.metadata?.metrics && e.metadata.metrics === provider.guid),
    }));
  });
}
