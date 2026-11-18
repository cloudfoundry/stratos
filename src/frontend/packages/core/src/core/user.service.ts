import { Injectable, inject } from '@angular/core';

import { UserSignalService } from './signals/user-signal.service';

/**
 * User facade over {@link UserSignalService} (signal-native).
 *
 * Kept as a thin shim so the call sites that still pull `UserService`
 * (and the matching tests) continue to work. New code should inject
 * `UserSignalService` directly.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSignals = inject(UserSignalService);

  readonly isAdmin = this.userSignals.isAdmin;
  readonly isEndpointAdmin = this.userSignals.isEndpointAdmin;
}
