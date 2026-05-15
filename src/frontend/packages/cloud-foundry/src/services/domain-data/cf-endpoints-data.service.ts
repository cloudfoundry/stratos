import { Injectable, Signal, computed, inject } from '@angular/core';

import {
  EndpointModel,
  EndpointsDataService,
  IRequestEntityTypeState,
} from '@stratosui/store';

import { CF_ENDPOINT_TYPE } from '../../cf-types';

// Signal-native bridge for Stratos endpoint registry reads consumed
// across the cloud-foundry package.
//
// Wave 2 (W36-B): the underlying source is now {@link EndpointsDataService}
// signals rather than the legacy `endpointEntitiesSelector` /
// `connectedEndpointsSelector` / `connectedEndpointsOfTypesSelector` chain.
// The public surface (object-keyed `IRequestEntityTypeState`) is preserved
// so consumers downstream (`Object.values(...)`, `Object.keys(...)`) keep
// working unchanged. Each accessor returns a stable `computed` signal
// derived from the new service's `Map`.
//
// Surface kept intentionally minimal — only the selectors actually
// used in this package are exposed:
//   all                — Signal<IRequestEntityTypeState<EndpointModel>>
//   connected          — Signal<IRequestEntityTypeState<EndpointModel>>
//   connectedCf        — Signal<IRequestEntityTypeState<EndpointModel>>
@Injectable({ providedIn: 'root' })
export class CfEndpointsDataService {
  private readonly endpointsService = inject(EndpointsDataService);

  readonly all: Signal<IRequestEntityTypeState<EndpointModel>> = computed(() =>
    mapToRecord(this.endpointsService.endpoints()),
  );

  readonly connected: Signal<IRequestEntityTypeState<EndpointModel>> = computed(() =>
    mapToRecord(this.endpointsService.endpoints(), e => e.connectionStatus === 'connected'),
  );

  readonly connectedCf: Signal<IRequestEntityTypeState<EndpointModel>> = computed(() =>
    mapToRecord(
      this.endpointsService.endpoints(),
      e => e.cnsi_type === CF_ENDPOINT_TYPE && e.connectionStatus === 'connected',
    ),
  );

  readonly connectedCfList: Signal<EndpointModel[]> = computed(() =>
    Object.values(this.connectedCf()),
  );

  readonly hasConnectedCf: Signal<boolean> = computed(() =>
    this.connectedCfList().length > 0,
  );
}

function mapToRecord(
  map: Map<string, EndpointModel>,
  predicate?: (e: EndpointModel) => boolean,
): IRequestEntityTypeState<EndpointModel> {
  const out: IRequestEntityTypeState<EndpointModel> = {};
  map.forEach((endpoint, guid) => {
    if (!predicate || predicate(endpoint)) {
      out[guid] = endpoint;
    }
  });
  return out;
}
