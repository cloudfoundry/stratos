import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { TailwindDialogService } from './shared/services/tailwind-dialog.service';
import { Store } from '@ngrx/store';
import { VerifySession, selectDashboardState, DashboardState, AppState, AuthState } from '@stratosui/store';
import { combineLatest, fromEvent, interval, merge, Subscription } from 'rxjs';
import { tap, withLatestFrom } from 'rxjs/operators';

import { LogOutDialogComponent } from './core/log-out-dialog/log-out-dialog.component';
import { PageVisible } from './core/page-visible';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from './core/permissions/stratos-user-permissions.checker';

@Injectable({
  providedIn: 'root'
})
export class LoggedInService {
  private userInteractionChecker: Subscription;
  private lastUserInteraction = Date.now();
  private sessionChecker: Subscription;

  // Check the session every 5 seconds (Note: this is vey cheap to do unless the session is about to expire)
  private readonly checkSessionInterval: number = 5 * 1000;

  // Warn inactive users 2 minutes before logging them out
  private readonly warnBeforeLogout: number = 2 * 60 * 1000;

  // User considered idle if no interaction for 5 minutes
  private readonly userIdlePeriod: number = 5 * 60 * 1000;

  // Avoid a race condition where the cookie is deleted if the user presses ok just before expiration
  private readonly autoLogoutDelta: number = 5 * 1000;

  // When we see the following events, we consider the user as active
  private readonly userActiveEvents = ['keydown', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'scroll', 'wheel'];

  private activityPromptShown = false;
  private sub: Subscription;
  private destroying = false;
  private initialized = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private store: Store<AppState>,
    private dialog: TailwindDialogService,
    private ngZone: NgZone,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) { }

  init() {
    // Prevent multiple initializations
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const eventStreams = this.userActiveEvents.map((eventName) => {
      return fromEvent(this.document, eventName);
    });

    const auth$ = this.store.select(s => s.auth);
    const canNotLogout$ = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.CAN_NOT_LOGOUT);
    this.sub = combineLatest([auth$, canNotLogout$]).subscribe(([auth, canNotLogout]) => {
      if (!canNotLogout && auth.loggedIn && auth.sessionData && auth.sessionData.valid && !auth.error) {
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

  // Run outside Angular zone to prevent E2E test timeouts
  // Polling intervals should not block Angular change detection
  private openSessionCheckerPoll() {
    this.closeSessionCheckerPoll();
    // Ensure interval configuration is valid
    const intervalTime = this.checkSessionInterval || 5000;
    this.ngZone.runOutsideAngular(() => {
      this.sessionChecker = interval(intervalTime)
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


  private _promptInactiveUser(expiryDate: number) {
    this.activityPromptShown = true;

    const dialogRef = this.dialog.open(LogOutDialogComponent, {
      data: { expiryDate },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((verify: boolean = false) => {
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

    // Guard against undefined authState or sessionData
    if (!authState || !authState.sessionData || typeof authState.sessionData.sessionExpiresOn !== 'number') {
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

