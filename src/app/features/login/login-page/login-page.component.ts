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
            this.error = auth.error && !auth.sessionData;

            if (this.error) {
              this.message = `Couldn't log in, please try again.`;
            } else if (auth.verifying) {
              this.message = 'Verifying session...';
            } else if (cnsis.loading) {
              this.message = 'Fetching Cloud Foundry information...';
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
