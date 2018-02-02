import { CNSISState } from '../../../store/types/cnsis.types';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms/src/directives';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Rx';

import { Login } from '../../../store/actions/auth.actions';
import { AppState } from '../../../store/app-state';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { RouterNav } from '../../../store/actions/router.actions';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit, OnDestroy {

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) { }

  loginForm: NgForm;

  username: string;
  password: string;

  loggedIn: boolean;
  loggingIn: boolean;
  error: boolean;

  message = '';

  subscription: Subscription;

  ngOnInit() {
    this.subscription =
      this.store.select(s => [s.auth, s.cnsis])
        .subscribe(([auth, cnsis]: [AuthState, CNSISState]) => {
          if (!auth.loggingIn && auth.loggedIn && auth.sessionData && auth.sessionData.valid) {
            this.subscription.unsubscribe(); // Ensure to unsub otherwise GoToState gets caught in loop
            this.store.dispatch(new RouterNav({ path: [auth.redirectPath || '/'] }, null));
          } else {
            this.loggedIn = auth.loggedIn;
            this.loggingIn = auth.loggingIn;
            // auth.sessionData will be populated if user has been redirected here after attempting to access a protected page without
            // a valid session
            this.error = auth.error && (!auth.sessionData || !auth.sessionData.valid);

            if (this.error) {
              if (auth.error && auth.errorResponse && auth.errorResponse === 'Invalid session') {
                // Invalid session (redirected after attempting to access a protected page). Don't show any error
                this.message = '';
              } else if (auth.error && auth.errorResponse && auth.errorResponse.status === 401) {
                // User supplied invalid credentials
                this.message = 'Username and password combination incorrect. Please try again.';
              } else {
                // All other errors
                this.message = 'Couldn\'t log in, please try again.';
              }
            } else if (auth.verifying) {
              this.message = 'Verifying session...';
            } else if (cnsis.loading) {
              this.message = 'Retrieving Cloud Foundry metadata...';
            } else if (auth.loggingIn) {
              this.message = 'Logging in...';
            }
          }
        });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  login() {
    this.message = '';
    this.store.dispatch(new Login(this.username, this.password));
  }

}
