import { Injectable, Signal, computed, inject } from '@angular/core';
import { EndpointsDataService, EndpointState } from '@stratosui/store';

/**
 * Signal-native projection of the endpoints loading/error aggregate.
 *
 * Wave 2 (W36-B): now sourced from {@link EndpointsDataService} directly
 * rather than the legacy `endpointStatusSelector`. Maintains the legacy
 * `EndpointState`-shaped surface (`{loading, error, message}`) so existing
 * consumers (`status()`, `loading()`, `error()`, `message()`, `initialised()`)
 * continue to work unchanged.
 *
 * For the entity entries themselves use `EndpointsSignalService.endpoints`.
 */
@Injectable({ providedIn: 'root' })
export class EndpointStatusSignalService {
  private endpointsService = inject(EndpointsDataService);

  /** Raw endpoints request state. Default-shaped before the service hydrates. */
  readonly status: Signal<EndpointState> = computed(() => ({
    loading: this.endpointsService.loading(),
    error: !!this.endpointsService.error(),
    message: this.endpointsService.error() ?? '',
  }));

  readonly loading: Signal<boolean> = computed(() => !!this.status().loading);
  readonly error: Signal<boolean> = computed(() => !!this.status().error);
  readonly message: Signal<string> = computed(() => this.status().message ?? '');

  /** True once the initial endpoints fetch has completed (loading flipped false). */
  readonly initialised: Signal<boolean> = computed(() => !this.loading());
}
