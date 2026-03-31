import { Component, OnInit, ChangeDetectionStrategy, computed, ApplicationRef, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { InternalAppState, RouterRedirect, Login, VerifySession, AuthState } from '@stratosui/store';
import { LOGIN_SUCCESS } from '../../../../../store/src/actions/auth.actions';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, distinctUntilChanged, shareReplay, filter, tap, switchMap, take } from 'rxjs/operators';
import { StratosThemeService } from '../../../../../theme/theme.service';

import { queryParamMap } from '../../../core/auth-guard.service';
import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { ShowHideButtonComponent } from '../../../core/show-hide-button/show-hide-button.component';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IntroScreenComponent,
    ShowHideButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent implements OnInit {
  private store = inject<Store<Pick<InternalAppState, 'endpoints' | 'auth'>>>(Store);
  private themeService = inject(StratosThemeService);
  private router = inject(Router);
  private actions$ = inject(Actions);
  private appRef = inject(ApplicationRef);


  // Theme-related signals
  public loginBackground = computed(() => {
    const theme = this.themeService.theme();
    const bgImage = theme?.login?.backgroundImage;
    return bgImage ? `url(${bgImage})` : 'none';
  });

  public loginBackgroundColor = computed(() =>
    this.themeService.theme()?.login?.backgroundColor || '#ffffff'
  );

  public loginCardBackground = computed(() =>
    this.themeService.theme()?.login?.cardBackground || '#ffffff'
  );

  public themeLogo = computed(() =>
    this.themeService.theme()?.branding?.logo || '/core/assets/logo.png'
  );

  public themeTitle = computed(() =>
    this.themeService.theme()?.branding?.loginTitle || 'Stratos'
  );

  public themeDisplayName = computed(() =>
    this.themeService.theme()?.branding?.displayName || ''
  );

  public themeSubtitle = computed(() =>
    this.themeService.theme()?.branding?.loginSubtitle || ''
  );

  // Form state
  loginForm!: NgForm;
  username = '';
  password = '';
  showPassword = false;
  message = '';

  // Reactive state observables
  private readonly auth$ = this.store.select(s => s.auth).pipe(
    distinctUntilChanged((prev, curr) =>
      prev.verifying === curr.verifying &&
      prev.loggingIn === curr.loggingIn &&
      prev.loggedIn === curr.loggedIn &&
      prev.error === curr.error &&
      prev.sessionData?.valid === curr.sessionData?.valid
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private readonly endpoints$ = this.store.select(s => s.endpoints).pipe(
    distinctUntilChanged((prev, curr) => prev.loading === curr.loading),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  // Track navigation state
  private readonly navigationInProgress$ = new BehaviorSubject<boolean>(false);

  // App ready signal - wait for app to be stable before allowing navigation
  readonly appReady$ = this.appRef.isStable.pipe(
    filter(stable => stable),
    take(1),
    map(() => true),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  // Public observables for template
  readonly busy$ = combineLatest([
    this.appReady$.pipe(startWith(false)),
    this.auth$,
    this.endpoints$,
    this.navigationInProgress$
  ]).pipe(
    map(([appReady, auth, endpoints, navigating]) =>
      !appReady ||           // App not ready yet
      auth.verifying ||      // Verifying session
      auth.loggingIn ||      // Logging in
      endpoints.loading ||   // Loading endpoints
      navigating             // Navigating after login
    ),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  readonly loggedIn$ = this.auth$.pipe(
    map(auth => auth.loggedIn),
    distinctUntilChanged()
  );

  readonly ssoLogin$ = this.auth$.pipe(
    map(auth => !!(auth.sessionData && auth.sessionData.ssoOptions)),
    distinctUntilChanged()
  );

  // Track redirect attempts changes reactively
  private readonly redirectAttemptsSubject$ = new BehaviorSubject<number>(0);

  readonly showLoginButton$ = combineLatest([
    this.loggedIn$,
    this.redirectAttemptsSubject$
  ]).pipe(
    map(([loggedIn, attempts]) => !loggedIn || attempts > this.MAX_REDIRECT_ATTEMPTS),
    distinctUntilChanged()
  );

  readonly message$ = this.auth$.pipe(
    map(auth => {
      const params = queryParamMap();
      const ssoMessage = params.SSO_Message;

      if (ssoMessage) {
        return ssoMessage;
      }

      if (auth.error && (!auth.sessionData || !auth.sessionData.valid) &&
          !(auth.sessionData && auth.sessionData.ssoOptions)) {
        return this.getErrorMessage(auth);
      }

      if (this.redirectAttempts > this.MAX_REDIRECT_ATTEMPTS) {
        return 'Session expired. Please log in again.';
      }

      return '';
    }),
    tap(msg => this.message = msg),
    distinctUntilChanged()
  );

  // Redirect loop protection
  private readonly MAX_REDIRECT_ATTEMPTS = 2;
  private readonly REDIRECT_COUNTER_KEY = 'stratos_login_redirect_attempts';

  private get redirectAttempts(): number {
    return parseInt(sessionStorage.getItem(this.REDIRECT_COUNTER_KEY) || '0', 10);
  }

  private set redirectAttempts(value: number) {
    sessionStorage.setItem(this.REDIRECT_COUNTER_KEY, value.toString());
    this.redirectAttemptsSubject$.next(value);
  }

  private clearRedirectAttempts() {
    sessionStorage.removeItem(this.REDIRECT_COUNTER_KEY);
    this.redirectAttemptsSubject$.next(0);
  }

  ngOnInit() {
    // Initialize the BehaviorSubject with current value
    this.redirectAttemptsSubject$.next(this.redirectAttempts);

    // Dispatch initial session verification
    this.store.dispatch(new VerifySession());

    // Handle auto-redirect ONLY for valid existing sessions (page refresh/direct navigation)
    this.auth$.pipe(
      filter(auth => {
        // Only auto-redirect if already logged in (existing session)
        return !auth.loggingIn && !auth.verifying && auth.loggedIn && auth.sessionData?.valid;
      }),
      take(1),  // Only check once on init
      switchMap(() => this.appReady$)  // Wait for app to be stable before navigating
    ).subscribe(async () => {
      this.navigationInProgress$.next(true);
      try {
        // Get current auth state
        const auth = await this.auth$.pipe(take(1)).toPromise();

        // Check for special redirects first
        if (auth.sessionData?.upgradeInProgress) {
          await this.router.navigate(['/upgrade'], { skipLocationChange: true });
          return;
        }

        if (auth.sessionData?.uaaError) {
          await this.router.navigate(['/setup']);
          return;
        }

        if (auth.sessionData?.domainMismatch) {
          await this.router.navigate(['/domainMismatch'], { skipLocationChange: true });
          return;
        }

        // Handle SSO no-splash redirect
        if (auth.sessionData?.ssoOptions &&
            auth.sessionData.ssoOptions.indexOf('nosplash') >= 0 &&
            !queryParamMap().SSO_Message) {
          this.doSSOLoginReactive().subscribe();
          return;
        }

        // Normal redirect
        await this.handleSuccessfulLogin(auth);
      } finally {
        this.navigationInProgress$.next(false);
      }
    });

    // Subscribe to message$ to keep it updated
    this.message$.subscribe();
  }

  login() {
    // Check for SSO synchronously using store snapshot
    this.store.select(s => s.auth.sessionData).pipe(
      take(1)
    ).subscribe(sessionData => {
      if (sessionData?.ssoOptions) {
        this.doSSOLoginReactive().subscribe();
        return;
      }

      // Clear redirect counter and dispatch login
      this.clearRedirectAttempts();
      this.message = '';

      this.store.dispatch(new Login(this.username, this.password));

      // Wait for LOGIN_SUCCESS, then ensure app is ready before navigating
      this.actions$.pipe(
        ofType(LOGIN_SUCCESS),
        take(1),
        switchMap(() => this.appReady$),  // Wait for app to be stable
        switchMap(() => this.auth$.pipe(
          filter(a => a.loggedIn && a.sessionData?.valid),
          take(1)
        ))
      ).subscribe(async auth => {
        this.navigationInProgress$.next(true);
        try {
          await this.handleSuccessfulLogin(auth);
        } finally {
          this.navigationInProgress$.next(false);
        }
      });
    });
  }

  private async handleSuccessfulLogin(auth: AuthState): Promise<null> {
    this.redirectAttempts++;

    // Prevent infinite redirect loop
    if (this.redirectAttempts > this.MAX_REDIRECT_ATTEMPTS) {
      return null;
    }

    const redirect: RouterRedirect = auth.redirect;
    const targetPath = redirect ? decodeURI(redirect.path) : '/home';
    const queryParams = redirect?.queryParams || {};

    try {
      const navResult = await this.router.navigate([targetPath], { queryParams });

      // Check if navigation actually succeeded
      if (navResult === false) {
        throw new Error('Navigation blocked');
      }

      // Success! Clear attempts since we successfully redirected
      this.clearRedirectAttempts();
    } catch (error) {
      // Hard redirect as fallback
      const queryString = Object.keys(queryParams).length > 0
        ? '?' + Object.entries(queryParams).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&')
        : '';
      window.location.href = targetPath + queryString;
    }

    return null;
  }

  private doSSOLoginReactive(): Observable<null> {
    return this.auth$.pipe(
      take(1),
      tap((auth): void => {
        const redirect: RouterRedirect = auth.redirect;
        const returnUrl = this.formSSOredirectURL(redirect);
        window.open('/pp/v1/auth/sso_login?state=' + encodeURIComponent(returnUrl), '_self');
      }),
      map((): null => null)
    );
  }

  private formSSOredirectURL(redirect: RouterRedirect): string {
    const queryKeys = redirect ? Object.keys(redirect.queryParams) : undefined;
    return window.location.protocol + '//' + window.location.hostname +
      (window.location.port ? ':' + window.location.port : '') +
      (redirect ?
        redirect.path +
        (queryKeys && queryKeys.length > 0 ? '?' + queryKeys.map(k => k + '=' + redirect.queryParams[k]).join('&') : '') : '/');
  }

  private getErrorMessage(auth: AuthState): string {
    if (!auth.error || !auth.errorResponse) {
      return `Couldn't log in, please try again.`;
    }

    if (auth.errorResponse === 'Invalid session') {
      return '';
    }

    if (auth.errorResponse.status === 401) {
      const authError = auth.errorResponse.error?.error;
      if (authError && authError !== 'Bad credentials') {
        return authError;
      }
      return 'Username and password combination incorrect. Please try again.';
    }

    if (auth.errorResponse.status >= 500 && auth.errorResponse.status < 600) {
      return `Couldn't check credentials, please try again. If the problem persists please contact an administrator`;
    }

    return `Couldn't log in, please try again.`;
  }
}
