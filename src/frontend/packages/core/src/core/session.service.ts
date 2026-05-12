import { Injectable, Signal, computed, inject } from '@angular/core';
import { AuthState, SessionData, SessionDataConfig } from '@stratosui/store';

import { AuthSignalService } from './signals/auth-signal.service';

/**
 * Compatibility shim that re-exports the signals from {@link AuthSignalService}
 * under the legacy `SessionService` name. Existing consumers reading
 * `service.auth() / sessionData() / config()` continue to work; new code
 * should inject `AuthSignalService` (or `SessionSignalService` for the
 * higher-level helpers) directly.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private authSignals = inject(AuthSignalService);

  readonly auth: Signal<AuthState | undefined> = this.authSignals.auth;

  readonly sessionData: Signal<SessionData | null> = this.authSignals.sessionData;

  readonly config: Signal<SessionDataConfig | null> = computed(
    () => this.sessionData()?.config ?? null
  );
}
