import { Injectable, Injector, Signal, computed, inject } from '@angular/core';
import { EndpointsDataService, observeSignal } from '@stratosui/store';
import { Observable } from 'rxjs';

export interface EndpointStatusState {
  loading: boolean;
  error: boolean;
  message: string;
}

/**
 * Signal-native projection of the endpoints loading/error aggregate,
 * sourced from {@link EndpointsDataService}.
 */
@Injectable({ providedIn: 'root' })
export class EndpointStatusSignalService {
  private endpointsService = inject(EndpointsDataService);

  /** Raw endpoints request state. Default-shaped before the service hydrates. */
  readonly status: Signal<EndpointStatusState> = computed(() => ({
    loading: this.endpointsService.loading(),
    error: !!this.endpointsService.error(),
    message: this.endpointsService.error() ?? '',
  }));

  /**
   * `status` as an observable, built once for the endpoints guard. Each
   * subscriber gets its own watcher, which ends when it unsubscribes.
   */
  readonly status$: Observable<EndpointStatusState> = observeSignal(this.status, inject(Injector));

  readonly loading: Signal<boolean> = computed(() => !!this.status().loading);
  readonly error: Signal<boolean> = computed(() => !!this.status().error);
  readonly message: Signal<string> = computed(() => this.status().message ?? '');

  /** True once the initial endpoints fetch has completed (loading flipped false). */
  readonly initialised: Signal<boolean> = computed(() => !this.loading());
}
