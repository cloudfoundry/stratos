import { Injectable, Signal, computed, inject } from '@angular/core';
import { SessionData, SessionDataConfig, UserEndpointsEnabled } from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';

/**
 * Signal-native session helpers.
 *
 * Mirrors the legacy `shared/services/session.service.ts` API
 * (`isTechPreview`, `userEndpointsEnabled`, `userEndpointsNotDisabled`) but
 * returns `Signal<boolean>` instead of `Observable<boolean>` so consumers can
 * compose without subscriptions.
 *
 * Reads through `AuthSignalService.sessionData()` — no separate store binding.
 */
@Injectable({ providedIn: 'root' })
export class SessionSignalService {
  private auth = inject(AuthSignalService);

  readonly sessionData: Signal<SessionData | null> = this.auth.sessionData;
  readonly config: Signal<SessionDataConfig | null> = computed(
    () => this.sessionData()?.config ?? null
  );

  /** True iff the running backend has tech-preview features enabled. */
  readonly isTechPreview: Signal<boolean> = computed(
    () => !!this.config()?.enableTechPreview
  );

  /** True iff per-user endpoint registration is fully enabled. */
  readonly userEndpointsEnabled: Signal<boolean> = computed(
    () => this.config()?.userEndpointsEnabled === UserEndpointsEnabled.ENABLED
  );

  /**
   * True iff per-user endpoint registration is not explicitly disabled
   * (i.e. ENABLED or ADMIN_ONLY).
   */
  readonly userEndpointsNotDisabled: Signal<boolean> = computed(
    () => this.config()?.userEndpointsEnabled !== UserEndpointsEnabled.DISABLED
  );
}
