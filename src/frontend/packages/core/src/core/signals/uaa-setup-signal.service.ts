import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AppState, UAASetupState } from '@stratosui/store';

const EMPTY_UAA_SETUP: UAASetupState = {
  payload: null,
  setup: false,
  error: false,
  message: '',
  settingUp: false,
};

/**
 * Signal-native projection of the `uaaSetup` ngrx slice.
 *
 * Read-through wrapper over `Store.select(s => s.uaaSetup)`. Used by the
 * setup-welcome / local-account-wizard / console-uaa-wizard flows, which
 * historically held a long-lived `Observable<UAASetupState>` and pushed it
 * through `combineLatest` against the auth slice.
 *
 * Writes still go through UAA setup actions — this service is read-side only.
 */
@Injectable({ providedIn: 'root' })
export class UaaSetupSignalService {
  private store = inject<Store<AppState>>(Store);

  /** Raw uaaSetup slice. Empty/false defaults before the store hydrates. */
  readonly uaaSetup: Signal<UAASetupState> = toSignal(
    this.store.select(s => s.uaaSetup),
    { initialValue: EMPTY_UAA_SETUP }
  );

  readonly setup: Signal<boolean> = computed(() => !!this.uaaSetup().setup);
  readonly settingUp: Signal<boolean> = computed(() => !!this.uaaSetup().settingUp);
  readonly error: Signal<boolean> = computed(() => !!this.uaaSetup().error);
  readonly message: Signal<string> = computed(() => this.uaaSetup().message ?? '');
  readonly payload: Signal<UAASetupState['payload']> = computed(
    () => this.uaaSetup().payload ?? null
  );
}
