import { HostListener, Inject, Injectable, NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Rx';
import { Store } from '@ngrx/store';
import { AppState } from './store/app-state';
import { AuthState } from './store/reducers/auth.reducer';
import { VerifySession } from './store/actions/auth.actions';
import { MdDialog } from '@angular/material';
import { LogOutDialogComponent } from './core/log-out-dialog/log-out-dialog.component';
import { Observable } from 'rxjs/Observable';
import { SessionData } from './store/types/auth.types';

@Injectable()
export class LoggedInService {

  private _sessionData: SessionData;
  private _userInteractionChecker: Subscription;

  private _lastUserInteraction = Date.now();
  private _sessionChecker;

  // Check the session every 30 seconds (Note: this is vey cheap to do unless the session is about to expire)
  private _checkSessionInterval = 30 * 1000;

  // Warn inactive users 2 minutes before logging them out
  private _warnBeforeLogout = 2 * 60 * 1000;

  // User considered idle if no interaction for 5 minutes
  private _userIdlePeriod = 5 * 60 * 1000;

  // Avoid a race condition where the cookie is deleted if the user presses ok just before expiration
  private _autoLogoutDelta = 5 * 1000;

  // When we see the following events, we consider the user as active
  private _userActiveEvents = ['keydown', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'scroll', 'wheel'];

  private _activityPromptShown = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private store: Store<AppState>,
    private dialog: MdDialog,
    ngZone: NgZone
  ) {

    const eventStreams = this._userActiveEvents.map((eventName) => {
      return Observable.fromEvent(document, eventName);
    });

    this.store.select(s => s.auth)
      .subscribe((auth: AuthState) => {
        this._sessionData = auth.sessionData;
        if (auth.loggedIn && auth.sessionData && auth.sessionData.valid) {
          if (!this._sessionChecker) {
            ngZone.runOutsideAngular(() => {
              // Run outside of zone to allow protractor to finish
              this._sessionChecker = setInterval(() => {
                ngZone.run(() => {
                  // Run inside zone for change detection
                  this._checkSession();
                });
              }, this._checkSessionInterval);
            });
          }
          if (!this._userInteractionChecker) {
            this._userInteractionChecker = Observable.merge(...eventStreams).subscribe(() => {
              this._lastUserInteraction = Date.now();
            });
          }
        } else {
          if (this._sessionChecker) {
            clearInterval(this._sessionChecker);
            delete this._sessionChecker;
          }
          if (this._userInteractionChecker) {
            this._userInteractionChecker.unsubscribe();
          }
        }
      });

  }

  private _promptInactiveUser(expiryDate) {
    this._activityPromptShown = true;

    const dialogRef = this.dialog.open(LogOutDialogComponent, {
      data: { expiryDate },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((verrify = false) => {
      if (verrify) {
        this.store.dispatch(new VerifySession(false, false));
      }
      this._activityPromptShown = false;
    });
  }

  private _checkSession() {
    if (this._activityPromptShown) {
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
      }
    }
  }
}
