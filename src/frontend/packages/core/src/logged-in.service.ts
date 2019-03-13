import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { fromEvent, interval, merge, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { VerifySession } from '../../store/src/actions/auth.actions';
import { AppState } from '../../store/src/app-state';
import { AuthState } from '../../store/src/reducers/auth.reducer';
import { SessionData } from '../../store/src/types/auth.types';
import { LogOutDialogComponent } from './core/log-out-dialog/log-out-dialog.component';

@Injectable()
export class LoggedInService {

  private sessionData: SessionData;
  private userInteractionChecker: Subscription;

  private lastUserInteraction = Date.now();
  private sessionChecker: Subscription;

  // Check the session every 5 seconds (Note: this is vey cheap to do unless the session is about to expire)
  private checkSessionInterval = 5 * 1000;

  // Warn inactive users 2 minutes before logging them out
  private warnBeforeLogout = 2 * 60 * 1000;

  // User considered idle if no interaction for 5 minutes
  private userIdlePeriod = 5 * 60 * 1000;

  // Avoid a race condition where the cookie is deleted if the user presses ok just before expiration
  private autoLogoutDelta = 5 * 1000;

  // When we see the following events, we consider the user as active
  private userActiveEvents = ['keydown', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'scroll', 'wheel'];

  private activityPromptShown = false;

  private sub: Subscription;

  private destroying = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private ngZone: NgZone
  ) {
  }

  init() {
    const eventStreams = this.userActiveEvents.map((eventName) => {
      return fromEvent(document, eventName);
    });

    this.sub = this.store.select(s => s.auth)
      .subscribe((auth: AuthState) => {
        this.sessionData = auth.sessionData;
        if (auth.loggedIn && auth.sessionData && auth.sessionData.valid) {
          if (!this.sessionChecker || this.sessionChecker.closed) {
            this.openSessionCheckerPoll();
          }
          if (!this.userInteractionChecker) {
            this.userInteractionChecker = merge(...eventStreams).subscribe(() => {
              this.lastUserInteraction = Date.now();
            });
          }
        } else {
          this.closeSessionCheckerPoll();
          if (this.userInteractionChecker) {
            this.userInteractionChecker.unsubscribe();
          }
        }
      });
  }

  destroy() {
    this.destroying = true;
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.closeSessionCheckerPoll();
    if (this.userInteractionChecker) {
      this.userInteractionChecker.unsubscribe();
    }
  }

  // Run outside Angular zone for protractor tests to work
  // See: https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular
  private openSessionCheckerPoll() {
    this.closeSessionCheckerPoll();
    this.ngZone.runOutsideAngular(() => {
      this.sessionChecker = interval(this.checkSessionInterval)
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
    if (this.sessionChecker && !this.sessionChecker.closed) {
      this.sessionChecker.unsubscribe();
    }
  }


  private _promptInactiveUser(expiryDate) {
    this.activityPromptShown = true;

    const dialogRef = this.dialog.open(LogOutDialogComponent, {
      data: { expiryDate },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((verify = false) => {
      if (verify) {
        this.store.dispatch(new VerifySession(false, false));
        this.openSessionCheckerPoll();
      }
      this.activityPromptShown = false;
    });
  }

  private _checkSession() {
    if (this.activityPromptShown || this.destroying) {
      return;
    }

    const now = Date.now();
    const sessionExpiresOn = this.sessionData.sessionExpiresOn;
    const safeExpire = sessionExpiresOn - this.autoLogoutDelta;
    const delta = safeExpire - now;
    const aboutToExpire = delta < this.warnBeforeLogout;
    if (aboutToExpire) {
      const idleDelta = now - this.lastUserInteraction;
      const userIsActive = idleDelta < this.userIdlePeriod;
      if (userIsActive) {
        this.store.dispatch(new VerifySession(false, false));
      } else {
        this._promptInactiveUser(safeExpire);
        this.closeSessionCheckerPoll();
      }
    }
  }
}
