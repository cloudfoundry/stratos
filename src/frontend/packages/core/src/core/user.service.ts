import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { UserSignalService } from './signals/user-signal.service';

/**
 * Legacy Observable-shaped user facade. Delegates to {@link UserSignalService}
 * (signal-native) and exposes Observables for consumers that haven't yet
 * migrated to signals.
 *
 * Kept as a thin compatibility shim so the call sites that still pull
 * `UserService` (and the matching tests) continue to work. New code should
 * inject `UserSignalService` directly.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSignals = inject(UserSignalService);

  readonly isAdmin = this.userSignals.isAdmin;
  readonly isEndpointAdmin = this.userSignals.isEndpointAdmin;

  isAdmin$: Observable<boolean>;
  isEndpointAdmin$: Observable<boolean>;

  constructor() {
    const userSignals = this.userSignals;

    this.isAdmin$ = toObservable(userSignals.isAdmin);
    this.isEndpointAdmin$ = toObservable(userSignals.isEndpointAdmin);
  }

}
