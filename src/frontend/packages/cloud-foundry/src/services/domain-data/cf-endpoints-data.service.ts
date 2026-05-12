import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  EndpointModel,
  IRequestEntityTypeState,
  Store,
  connectedEndpointsOfTypesSelector,
  connectedEndpointsSelector,
  endpointEntitiesSelector,
} from '@stratosui/store';

import { CFAppState } from '../../cf-app-state';
import { CF_ENDPOINT_TYPE } from '../../cf-types';

// Signal-native bridge for Stratos endpoint registry reads consumed
// across the cloud-foundry package. Wraps the existing NgRx selectors
// in `toSignal` so consumers can drop their `store.select(...)` calls
// without waiting for the endpoint state to migrate off NgRx.
//
// Surface kept intentionally minimal — only the selectors actually
// used in this package are exposed:
//   all                — Signal<IRequestEntityTypeState<EndpointModel>>
//   connected          — Signal<IRequestEntityTypeState<EndpointModel>>
//   connectedCf        — Signal<IRequestEntityTypeState<EndpointModel>>
//
// Each accessor returns a stable Signal wired through `toSignal` once
// at construction; consumers may convert back to Observable via
// `toObservable` where rxjs interop is still required.
@Injectable({ providedIn: 'root' })
export class CfEndpointsDataService {
  private readonly store = inject<Store<CFAppState>>(Store);

  readonly all: Signal<IRequestEntityTypeState<EndpointModel>> = toSignal(
    this.store.select(endpointEntitiesSelector),
    { initialValue: {} as IRequestEntityTypeState<EndpointModel> },
  );

  readonly connected: Signal<IRequestEntityTypeState<EndpointModel>> = toSignal(
    this.store.select(connectedEndpointsSelector()),
    { initialValue: {} as IRequestEntityTypeState<EndpointModel> },
  );

  readonly connectedCf: Signal<IRequestEntityTypeState<EndpointModel>> = toSignal(
    this.store.select(connectedEndpointsOfTypesSelector(CF_ENDPOINT_TYPE)),
    { initialValue: {} as IRequestEntityTypeState<EndpointModel> },
  );

  readonly connectedCfList: Signal<EndpointModel[]> = computed(() =>
    Object.values(this.connectedCf()),
  );

  readonly hasConnectedCf: Signal<boolean> = computed(() =>
    this.connectedCfList().length > 0,
  );
}
