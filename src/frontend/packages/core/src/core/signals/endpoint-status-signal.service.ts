import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { EndpointOnlyAppState, EndpointState, endpointStatusSelector } from '@stratosui/store';

const EMPTY_STATUS: EndpointState = {
  loading: false,
  error: false,
  message: '',
};

/**
 * Signal-native projection of the endpoints loading/error aggregate
 * (`state.endpoints` — which is the request-state metadata, not the entities).
 *
 * Mirrors `Store.select(endpointStatusSelector)` as a signal so guards and
 * page components can read `loading` / `error` / `message` without subscribing.
 *
 * For the entity entries themselves use `EndpointsSignalService.endpoints`.
 */
@Injectable({ providedIn: 'root' })
export class EndpointStatusSignalService {
  private store = inject<Store<EndpointOnlyAppState>>(Store);

  /** Raw endpoints request state. Default-shaped before the store hydrates. */
  readonly status: Signal<EndpointState> = toSignal(
    this.store.select(endpointStatusSelector),
    { initialValue: EMPTY_STATUS }
  );

  readonly loading: Signal<boolean> = computed(() => !!this.status().loading);
  readonly error: Signal<boolean> = computed(() => !!this.status().error);
  readonly message: Signal<string> = computed(() => this.status().message ?? '');

  /** True once the initial endpoints fetch has completed (loading flipped false). */
  readonly initialised: Signal<boolean> = computed(() => !this.loading());
}
