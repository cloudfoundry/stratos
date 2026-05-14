import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { SessionSignalService } from '../../core/signals/session-signal.service';

/**
 * Legacy Observable-shaped session-config facade. Delegates to
 * {@link SessionSignalService} (signal-native) and exposes the legacy
 * `Observable<boolean>` shape so existing pipe-based callers keep working.
 *
 * `take(1)` is preserved on each accessor to match the original
 * "first-truthy then complete" semantics — many call-sites used `combineLatest`
 * over these and relied on completion to terminate.
 *
 * New code should inject `SessionSignalService` directly and read the signals.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private sessionSignals = inject(SessionSignalService);

  // Bind in constructor to capture an injection context for `toObservable`.
  private readonly isTechPreview$: Observable<boolean>;
  private readonly userEndpointsEnabled$: Observable<boolean>;
  private readonly userEndpointsNotDisabled$: Observable<boolean>;

  constructor() {
    this.isTechPreview$ = toObservable(this.sessionSignals.isTechPreview);
    this.userEndpointsEnabled$ = toObservable(this.sessionSignals.userEndpointsEnabled);
    this.userEndpointsNotDisabled$ = toObservable(this.sessionSignals.userEndpointsNotDisabled);
  }

  isTechPreview(): Observable<boolean> {
    return this.isTechPreview$.pipe(take(1));
  }

  userEndpointsEnabled(): Observable<boolean> {
    return this.userEndpointsEnabled$.pipe(take(1));
  }

  userEndpointsNotDisabled(): Observable<boolean> {
    return this.userEndpointsNotDisabled$.pipe(take(1));
  }
}
