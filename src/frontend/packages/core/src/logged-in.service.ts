import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { fromEvent, interval, merge, Subscription } from 'rxjs';
import { tap, withLatestFrom } from 'rxjs/operators';

import { VerifySession } from '../../store/src/actions/auth.actions';
import { AppState } from '../../store/src/app-state';
import { AuthState } from '../../store/src/reducers/auth.reducer';
import { selectDashboardState } from '../../store/src/selectors/dashboard.selectors';
import { DashboardState } from './../../store/src/reducers/dashboard-reducer';
import { LogOutDialogComponent } from './core/log-out-dialog/log-out-dialog.component';
import { PageVisible } from './core/page-visible';

@Injectable()
export class LoggedInService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private ngZone: NgZone
  ) {
  }

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

  init() {
    const eventStreams = this.userActiveEvents.map((eventName) => {
      return fromEvent(document, eventName);
    });

    this.sub = this.store.select(s => s.auth)
      .subscribe((auth: AuthState) => {
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
          withLatestFrom(
            this.store.select(selectDashboardState),
            this.store.select(s => s.auth)
          ),
          tap(([, dashboardState, authState]) => {
            this.ngZone.run(() => {
              this._checkSession(dashboardState, authState);
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

  private _checkSession(dashboardState: DashboardState, authState: AuthState) {
    if (this.activityPromptShown || this.destroying) {
      return;
    }

    const now = Date.now();
    const sessionExpiresOn = authState.sessionData.sessionExpiresOn;
    const safeExpire = sessionExpiresOn - this.autoLogoutDelta;
    const delta = safeExpire - now;
    const aboutToExpire = delta < this.warnBeforeLogout;
    if (aboutToExpire) {
      const idleDelta = now - this.lastUserInteraction;
      const userIsActive = idleDelta < this.userIdlePeriod;
      const pageVisible = new PageVisible(document);
      if ((!dashboardState.timeoutSession && pageVisible.isPageVisible()) || userIsActive) {
        this.store.dispatch(new VerifySession(false, false));
      } else {
        this._promptInactiveUser(safeExpire);
        this.closeSessionCheckerPoll();
      }
    }
  }
}

