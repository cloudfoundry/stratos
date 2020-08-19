import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map, startWith, takeWhile, tap } from 'rxjs/operators';

import { Login, VerifySession } from '@stratosui/store';
import { RouterNav } from '@stratosui/store';
import { InternalAppState } from '@stratosui/store';
import { AuthState } from '@stratosui/store';
import { RouterRedirect } from '@stratosui/store';
import { queryParamMap } from '../../../core/auth-guard.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit, OnDestroy {

  constructor(
    private store: Store<Pick<InternalAppState, 'endpoints' | 'auth'>>
  ) { }

  loginForm: NgForm;

  username: string;
  password: string;

  loggedIn: boolean;
  loggingIn: boolean;
  verifying: boolean;
  error: boolean;

  ssoLogin: boolean;
  ssoOptions: string;

  busy$: Observable<boolean>;

  redirect: RouterRedirect;

  message = '';

  subscription: Subscription;

  ngOnInit() {
    this.ssoLogin = false;
    this.store.dispatch(new VerifySession());
    const auth$ = this.store.select(s => ({ auth: s.auth, endpoints: s.endpoints }));
    this.busy$ = auth$.pipe(
      map(
        ({ auth, endpoints }) => !auth.error || !(auth.sessionData && auth.sessionData.valid) &&
          (auth.sessionData && auth.sessionData.valid) || auth.verifying || auth.loggingIn || endpoints.loading
      ),
      startWith(true)
    );
    this.subscription =
      auth$
        .pipe(
          tap(({ auth }) => {
            this.redirect = auth.redirect;
            this.handleOther(auth);
          }),
          takeWhile(({ auth }) => {
            const loggedIn = !auth.loggingIn && auth.loggedIn;
            const validSession = auth.sessionData && auth.sessionData.valid;
            return !(loggedIn && validSession);
          }),
        )
        .subscribe({
          complete: () => this.handleSuccess()
        });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  formSSOredirectURL() {
    const queryKeys = this.redirect ? Object.keys(this.redirect.queryParams) : undefined;
    return window.location.protocol + '//' + window.location.hostname +
      (window.location.port ? ':' + window.location.port : '') +
      (this.redirect ?
        this.redirect.path +
        (queryKeys.length > 0 ? '?' + queryKeys.map(k => k + '=' + this.redirect.queryParams[k]).join('&') : '') : '/');
  }

  login() {
    if (this.ssoLogin) {
      return this.doSSOLogin();
    }
    this.message = '';
    this.store.dispatch(new Login(this.username, this.password));
  }

  private handleSuccess() {
    if (this.subscription) {
      this.subscription.unsubscribe(); // Ensure to unsub otherwise GoToState gets caught in loop
    }
    if (this.redirect) {
      this.store.dispatch(new RouterNav({ path: [this.redirect.path], query: this.redirect.queryParams || {} }));
    } else {
      this.store.dispatch(new RouterNav({ path: ['/'] }, null));
    }
  }

  private handleOther(auth: AuthState) {
    this.loggedIn = auth.loggedIn;
    this.loggingIn = auth.loggingIn;
    this.verifying = auth.verifying;
    this.ssoOptions = auth.sessionData && auth.sessionData.ssoOptions;
    this.ssoLogin = !!this.ssoOptions;

    const params = queryParamMap();
    const ssoMessage = params.SSO_Message;

    // Upgrade in progress
    if (auth.sessionData && auth.sessionData.upgradeInProgress) {
      this.subscription.unsubscribe(); // Ensure to unsub otherwise GoToState gets caught in loop
      this.store.dispatch(new RouterNav({ path: ['/upgrade'], extras: { skipLocationChange: true } }));
      return false;
    }

    // Setup mode
    if (auth.sessionData && auth.sessionData.uaaError) {
      this.subscription.unsubscribe(); // Ensure to unsub otherwise GoToState gets caught in loop
      this.store.dispatch(new RouterNav({ path: ['/setup'] }));
      return false;
    }

    // Cookie domain mismatch (user won't be able to login)
    if (auth.sessionData && auth.sessionData.domainMismatch) {
      this.subscription.unsubscribe(); // Ensure to unsub otherwise GoToState gets caught in loop
      this.store.dispatch(new RouterNav({ path: ['/domainMismatch'], extras: { skipLocationChange: true } }));
      return false;
    }

    // Check for SSO Login without splash page - i.e. redirect straight to SSO Login UI
    if (!this.loggedIn && this.ssoNoSplashPage() && !ssoMessage) {
      return this.doSSOLogin();
    }

    // auth.sessionData will be populated if user has been redirected here after attempting to access a protected page without
    // a valid session
    this.error = auth.error && (!auth.sessionData || !auth.sessionData.valid) && !this.ssoLogin;

    if (this.error) {
      this.setErrorMessage(auth);
    }

    if (!!ssoMessage) {
      this.message = ssoMessage;
    }
  }

  private setErrorMessage(auth: AuthState) {
    // Default error message
    this.message = `Couldn't log in, please try again.`;
    if (auth.error && auth.errorResponse) {
      if (auth.errorResponse === 'Invalid session') {
        // Invalid session (redirected after attempting to access a protected page). Don't show any error
        this.message = '';
      } else if (auth.errorResponse.status === 401) {
        // User supplied invalid credentials
        this.message = 'Username and password combination incorrect. Please try again.';
        // Is there a better error message available? e.g. account locked
        const authError = !!auth.errorResponse.error ? auth.errorResponse.error.error : null;
        if (!!authError && authError !== 'Bad credentials') {
          this.message = authError;
        }
      } else if (auth.errorResponse.status >= 500 && auth.errorResponse.status < 600) {
        this.message = `Couldn't check credentials, please try again. If the problem persists please contact an administrator`;
      }
    }
  }

  private ssoNoSplashPage() {
    return this.ssoLogin && this.ssoOptions.indexOf('nosplash') >= 0;
  }

  private doSSOLogin() {
    const returnUrl = encodeURIComponent(this.formSSOredirectURL());
    window.open('/pp/v1/auth/sso_login?state=' + returnUrl, '_self');
    this.busy$ = new Observable<boolean>((observer) => {
      observer.next(true);
      observer.complete();
    });
  }

}
