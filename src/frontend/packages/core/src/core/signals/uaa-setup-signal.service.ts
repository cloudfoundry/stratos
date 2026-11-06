import { Injectable, Signal, computed, inject } from '@angular/core';

import { UaaSetupDataService, UaaSetupState } from '../uaa-setup-data.service';

/**
 * Signal-native facade over {@link UaaSetupDataService}. Preserves the
 * legacy import path for existing wizard consumers; new code should
 * inject `UaaSetupDataService` directly.
 */
@Injectable({ providedIn: 'root' })
export class UaaSetupSignalService {
  private uaaData = inject(UaaSetupDataService);

  readonly uaaSetup: Signal<UaaSetupState> = this.uaaData.state;

  readonly setup: Signal<boolean> = computed(() => !!this.uaaSetup().setup);
  readonly settingUp: Signal<boolean> = computed(() => !!this.uaaSetup().settingUp);
  readonly error: Signal<boolean> = computed(() => !!this.uaaSetup().error);
  readonly message: Signal<string> = computed(() => this.uaaSetup().message ?? '');
  readonly payload: Signal<UaaSetupState['payload']> = computed(
    () => this.uaaSetup().payload ?? null
  );
}
