import { Injectable, Signal, computed, inject } from '@angular/core';

import { AuthSignalService } from './auth-signal.service';

const STRATOS_ENDPOINT_ADMIN_SCOPE = 'stratos.endpointadmin';

/**
 * Signal-native user helpers.
 *
 * Mirrors the legacy `core/user.service.ts` API (`isAdmin$`, `isEndpointAdmin$`)
 * with `Signal<boolean>` accessors derived from `AuthSignalService.sessionData()`.
 */
@Injectable({ providedIn: 'root' })
export class UserSignalService {
  private auth = inject(AuthSignalService);

  /** True iff the active session belongs to a Stratos admin. */
  readonly isAdmin: Signal<boolean> = computed(
    () => !!this.auth.sessionData()?.user?.admin
  );

  /** True iff the active session has the Stratos endpoint-admin scope. */
  readonly isEndpointAdmin: Signal<boolean> = computed(() => {
    const scopes = this.auth.sessionData()?.user?.scopes;
    return !!scopes && scopes.indexOf(STRATOS_ENDPOINT_ADMIN_SCOPE) !== -1;
  });
}
