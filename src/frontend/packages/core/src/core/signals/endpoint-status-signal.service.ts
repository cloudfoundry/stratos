import { Injectable, Signal, computed, inject } from '@angular/core';
import { EndpointsDataService } from '@stratosui/store';

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

  readonly loading: Signal<boolean> = computed(() => !!this.status().loading);
  readonly error: Signal<boolean> = computed(() => !!this.status().error);
  readonly message: Signal<string> = computed(() => this.status().message ?? '');

  /** True once the initial endpoints fetch has completed (loading flipped false). */
  readonly initialised: Signal<boolean> = computed(() => !this.loading());
}
