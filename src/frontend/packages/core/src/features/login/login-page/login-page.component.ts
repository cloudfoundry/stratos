import { Component, OnInit, ChangeDetectionStrategy, computed, ApplicationRef, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthState, RouterRedirect } from '@stratosui/store';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, distinctUntilChanged, shareReplay, filter, tap, switchMap, take } from 'rxjs/operators';
import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';

import { queryParamMap } from '../../../core/auth-guard.service';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { EndpointStatusSignalService } from '../../../core/signals/endpoint-status-signal.service';
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
  private authSignal = inject(AuthSignalService);
  private endpointStatusSignals = inject(EndpointStatusSignalService);
  private branding = inject(StratosBrandingService);
  private router = inject(Router);
  private appRef = inject(ApplicationRef);


  // Theme-related signals
  public loginBackground = computed(() => {
    const theme = this.branding.theme();
    const bgImage = theme?.login?.backgroundImage;
    return bgImage ? `url(${bgImage})` : 'none';
  });

  public loginBackgroundColor = computed(() =>
    this.branding.theme()?.login?.backgroundColor || '#ffffff'
  );

  public loginCardBackground = computed(() =>
    this.branding.theme()?.login?.cardBackground || '#ffffff'
  );

  public inputBackground = computed(() => this.branding.theme()?.login?.inputBackground || null);
  public inputBorder = computed(() => this.branding.theme()?.login?.inputBorder || null);

  public themeLogo = computed(() =>
    this.branding.theme()?.branding?.logo || '/core/assets/logo.png'
  );

  public themeTitle = computed(() =>
    this.branding.theme()?.branding?.loginTitle || 'Stratos'
  );

  public themeDisplayName = computed(() =>
    this.branding.theme()?.branding?.displayName || ''
  );

  public themeSubtitle = computed(() =>
    this.branding.theme()?.branding?.loginSubtitle || ''
  );

  public showLogo = computed(() => this.branding.theme()?.login?.showLogo ?? true);
  public showTitle = computed(() => this.branding.theme()?.login?.showTitle ?? true);
  public customMessage = computed(() => this.branding.theme()?.login?.customMessage || '');

  // Form state
  loginForm!: NgForm;
  username = '';
  password = '';
  showPassword = false;
  message = '';

  // Reactive state observables
  private readonly auth$ = toObservable(this.authSignal.auth).pipe(
    filter((auth): auth is AuthState => !!auth),
    distinctUntilChanged((prev, curr) =>
      prev.verifying === curr.verifying &&
      prev.loggingIn === curr.loggingIn &&
      prev.loggedIn === curr.loggedIn &&
      prev.error === curr.error &&
      prev.sessionData?.valid === curr.sessionData?.valid
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private readonly endpoints$ = toObservable(this.endpointStatusSignals.status).pipe(
    distinctUntilChanged((prev, curr) => prev.loading === curr.loading),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  // Bridge the AuthDataService login-completion marker to an observable so
  // login() can await a *fresh* completion (replaces the legacy
  // `actions$.pipe(ofType(LOGIN_SUCCESS))` listener).
  private readonly loginCompletedAt$ = toObservable(this.authSignal.loginCompletedAt);

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
        return this.sanitizeSsoMessage(ssoMessage);
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

  // SSO_Message arrives via the /login query string and is attacker-controllable
  // (issue #5672). Interpolation already blocks HTML/script injection; this strips
  // URL-like tokens so the banner can't be used to social-engineer a user to a
  // malicious link, and caps length to keep it a short status line.
  private sanitizeSsoMessage(raw: string): string {
    const urlLike = /\b(?:(?:[a-z][\w+.-]*:)?\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?/gi;
    return raw.replace(urlLike, '[link removed]').trim().slice(0, 256);
  }

  private clearRedirectAttempts() {
    sessionStorage.removeItem(this.REDIRECT_COUNTER_KEY);
    this.redirectAttemptsSubject$.next(0);
  }

  // Single cap check shared by every auto-redirect guard so there is one
  // budget, not a per-path copy of the comparison.
  private get underRedirectCap(): boolean {
    return this.redirectAttempts <= this.MAX_REDIRECT_ATTEMPTS;
  }

  ngOnInit() {
    // Initialize the BehaviorSubject with current value
    this.redirectAttemptsSubject$.next(this.redirectAttempts);

    // Trigger initial session verification
    this.authSignal.verifySession(true, true);

    // Handle auto-redirect ONLY for valid existing sessions (page refresh/direct navigation)
    this.auth$.pipe(
      filter(auth => {
        // Only auto-redirect if already logged in (existing session)
        return !auth.loggingIn && !auth.verifying && auth.loggedIn && !!auth.sessionData?.valid;
      }),
      take(1),  // Only check once on init
      switchMap(() => this.appReady$)  // Wait for app to be stable before navigating
    ).subscribe(async () => {
      this.navigationInProgress$.next(true);
      try {
        // Get current auth state
        const auth = await this.auth$.pipe(take(1)).toPromise();
        if (!auth) {
          // auth$ only completes without a value if the page is torn down mid-redirect
          return;
        }

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

        // Handle SSO no-splash redirect, under the same cap as the
        // unauthenticated nosplash path below (see shouldAutoRedirectNosplash) -
        // otherwise a valid session that keeps landing back on /login can
        // bounce to the IdP indefinitely.
        if (this.shouldAutoRedirectLoggedInNosplash(auth)) {
          this.redirectAttempts++;
          this.doSSOLoginReactive().subscribe();
          return;
        }

        // Either nosplash isn't in play, or the cap above stopped a bounce
        // loop: this attempt cycle is over, so clear the counter now rather
        // than only on a successful nav below - otherwise a cap hit here
        // leaves a stale count that blocks an unrelated, later unauthenticated
        // visit from auto-redirecting.
        this.clearRedirectAttempts();

        // Normal redirect
        await this.handleSuccessfulLogin(auth);
      } finally {
        this.navigationInProgress$.next(false);
      }
    });

    // Handle SSO 'nosplash' for unauthenticated visitors: when SSO is
    // configured with the nosplash option and there is no valid session,
    // redirect straight to the identity provider instead of showing the
    // login form / Sign In button. The auto-redirect above only covers the
    // already-logged-in case, so without this a first visit stops on the
    // login page despite nosplash being set.
    //
    // Loop protection: this fires on the same !loggedIn/!valid state a browser
    // lands in when it returns from an SSO round-trip that did NOT seat a
    // session (silent auth failure, cookie/config issue, back button). take(1)
    // does not help across page loads — each IdP round-trip is a full
    // navigation to a fresh component instance — so we gate on the persisted
    // redirectAttempts counter (sessionStorage) and bump it before redirecting.
    // The counter is reset once a valid session is seen (see logged-in branch
    // above) so a genuine later visit never inherits a stale count.
    this.auth$.pipe(
      filter(auth => this.shouldAutoRedirectNosplash(auth)),
      take(1),  // Only trigger once per component instance
      switchMap(() => this.appReady$)  // Wait for app to be stable before navigating
    ).subscribe(() => {
      this.redirectAttempts++;  // survives the IdP round-trip via sessionStorage; breaks a silent redirect loop
      this.doSSOLoginReactive().subscribe();
    });

    // Subscribe to message$ to keep it updated
    this.message$.subscribe();
  }

  login() {
    // Check for SSO synchronously via the auth signal snapshot
    const sessionData = this.authSignal.sessionData();
    if (sessionData?.ssoOptions) {
      this.doSSOLoginReactive().subscribe();
      return;
    }

    // Clear redirect counter and start login
    this.clearRedirectAttempts();
    this.message = '';

    // Capture the current completion marker so we react to the *next* login
    // completion, not a stale one from earlier in this app session.
    const startedAt = this.authSignal.loginCompletedAt();
    this.authSignal.login(this.username, this.password);

    // Wait for a fresh login completion, then ensure app is ready before navigating
    this.loginCompletedAt$.pipe(
      filter(t => t !== startedAt),
      take(1),
      switchMap(() => this.appReady$),  // Wait for app to be stable
      switchMap(() => this.auth$.pipe(
        filter(a => a.loggedIn && !!a.sessionData?.valid),
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
  }

  /**
   * Whether an unauthenticated visitor should be auto-redirected to the SSO
   * identity provider because `nosplash` is configured. Broken out from the
   * ngOnInit filter so the rule reads at a glance and the loop guard is
   * explicit:
   *   - idle           : not mid-login / mid-verify
   *   - noValidSession : logged out with a resolved (invalid) session
   *   - nosplash       : SSO configured with the nosplash option
   *   - not showing an SSO error message (avoids looping on a failed round-trip)
   *   - under the redirect cap (persisted across IdP round-trips via sessionStorage)
   */
  private shouldAutoRedirectNosplash(auth: AuthState): boolean {
    const idle           = !auth.loggingIn && !auth.verifying;
    const noValidSession = !auth.loggedIn && !!auth.sessionData && !auth.sessionData.valid;
    const nosplash       = !!auth.sessionData?.ssoOptions?.includes('nosplash');
    return idle && noValidSession && nosplash
      && !queryParamMap().SSO_Message
      && this.underRedirectCap;
  }

  // Logged-in counterpart to shouldAutoRedirectNosplash: a valid session
  // still configured for nosplash SSO gets bounced to the IdP too, under the
  // same shared cap.
  private shouldAutoRedirectLoggedInNosplash(auth: AuthState): boolean {
    const nosplash = !!auth.sessionData?.ssoOptions?.includes('nosplash');
    return nosplash && !queryParamMap().SSO_Message && this.underRedirectCap;
  }

  private async handleSuccessfulLogin(auth: AuthState): Promise<null> {
    this.redirectAttempts++;

    // Prevent infinite redirect loop
    if (!this.underRedirectCap) {
      return null;
    }

    const redirect: RouterRedirect | undefined = auth.redirect;
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
    } catch (_error) {
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
        const redirect: RouterRedirect | undefined = auth.redirect;
        const returnUrl = this.formSSOredirectURL(redirect);
        window.open('/pp/v1/auth/sso_login?state=' + encodeURIComponent(returnUrl), '_self');
      }),
      map((): null => null)
    );
  }

  private formSSOredirectURL(redirect: RouterRedirect | undefined): string {
    const queryParams = redirect?.queryParams;
    const queryKeys = queryParams ? Object.keys(queryParams) : undefined;
    return window.location.protocol + '//' + window.location.hostname +
      (window.location.port ? ':' + window.location.port : '') +
      (redirect ?
        redirect.path +
        (queryParams && queryKeys && queryKeys.length > 0
          ? '?' + queryKeys.map(k => k + '=' + queryParams[k]).join('&') : '') : '/');
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
