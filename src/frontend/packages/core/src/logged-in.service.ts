import { HostListener, Inject, Injectable, NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/src/app-state';
import { AuthState } from '../../store/src/reducers/auth.reducer';
import { VerifySession } from '../../store/src/actions/auth.actions';
import { MatDialog } from '@angular/material';
import { LogOutDialogComponent } from './core/log-out-dialog/log-out-dialog.component';
import { Observable, interval, Subscription, fromEvent, merge } from 'rxjs';
import { SessionData } from '../../store/src/types/auth.types';

import { tap } from 'rxjs/operators';

@Injectable()
export class LoggedInService {

  private _sessionData: SessionData;
  private _userInteractionChecker: Subscription;

  private _lastUserInteraction = Date.now();
  private _sessionChecker: Subscription;

  // Check the session every 5 seconds (Note: this is vey cheap to do unless the session is about to expire)
  private _checkSessionInterval = 5 * 1000;

  // Warn inactive users 2 minutes before logging them out
  private _warnBeforeLogout = 2 * 60 * 1000;

  // User considered idle if no interaction for 5 minutes
  private _userIdlePeriod = 5 * 60 * 1000;

  // Avoid a race condition where the cookie is deleted if the user presses ok just before expiration
  private _autoLogoutDelta = 5 * 1000;

  // When we see the following events, we consider the user as active
  private _userActiveEvents = ['keydown', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'scroll', 'wheel'];

  private _activityPromptShown = false;

  private _sub: Subscription;

  private _destroying = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private ngZone: NgZone
  ) {
  }

  init() {
    const eventStreams = this._userActiveEvents.map((eventName) => {
      return fromEvent(document, eventName);
    });

    this._sub = this.store.select(s => s.auth)
      .subscribe((auth: AuthState) => {
        this._sessionData = auth.sessionData;
        if (auth.loggedIn && auth.sessionData && auth.sessionData.valid) {
          if (!this._sessionChecker || this._sessionChecker.closed) {
            this.openSessionCheckerPoll();
          }
          if (!this._userInteractionChecker) {
            this._userInteractionChecker = merge(...eventStreams).subscribe(() => {
              this._lastUserInteraction = Date.now();
            });
          }
        } else {
          this.closeSessionCheckerPoll();
          if (this._userInteractionChecker) {
            this._userInteractionChecker.unsubscribe();
          }
        }
      });
  }

  destroy() {
    this._destroying = true;
    if (this._sub) {
      this._sub.unsubscribe();
    }
    this.closeSessionCheckerPoll();
    if (this._userInteractionChecker) {
      this._userInteractionChecker.unsubscribe();
    }
  }

  // Run outside Angular zone for protractor tests to work
  // See: https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular
  private openSessionCheckerPoll() {
    this.closeSessionCheckerPoll();
    this.ngZone.runOutsideAngular(() => {
      this._sessionChecker = interval(this._checkSessionInterval)
        .pipe(
          tap(() => {
            this.ngZone.run(() => {
              this._checkSession();
            });
          })
        ).subscribe();
    });
  }

  private closeSessionCheckerPoll() {
    if (this._sessionChecker && !this._sessionChecker.closed) {
      this._sessionChecker.unsubscribe();
    }
  }


  private _promptInactiveUser(expiryDate) {
    this._activityPromptShown = true;

    const dialogRef = this.dialog.open(LogOutDialogComponent, {
      data: { expiryDate },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((verify = false) => {
      if (verify) {
        this.store.dispatch(new VerifySession(false, false));
        this.openSessionCheckerPoll();
      }
      this._activityPromptShown = false;
    });
  }

  private _checkSession() {
    if (this._activityPromptShown || this._destroying) {
      return;
    }

    const now = Date.now();
    const sessionExpiresOn = this._sessionData.sessionExpiresOn;
    const safeExpire = sessionExpiresOn - this._autoLogoutDelta;
    const delta = safeExpire - now;
    const aboutToExpire = delta < this._warnBeforeLogout;
    if (aboutToExpire) {
      const idleDelta = now - this._lastUserInteraction;
      const userIsActive = idleDelta < this._userIdlePeriod;
      if (userIsActive) {
        this.store.dispatch(new VerifySession(false, false));
      } else {
        this._promptInactiveUser(safeExpire);
        this.closeSessionCheckerPoll();
      }
    }
  }
}
