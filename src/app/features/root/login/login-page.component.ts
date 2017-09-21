import { AppState } from '../../../store/app-state';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { CNSISState } from '../../../store/reducers/cnsis.reducer';
import { Login } from '../../../store/actions/auth.actions';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { NgForm } from '@angular/forms/src/directives';
import { Store } from '@ngrx/store';
import { Component, OnDestroy, OnInit } from '@angular/core';

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
          if (auth.loggedIn && auth.sessionData && auth.sessionData.valid) {
            this.router.navigateByUrl('');
          } else {
            this.loggedIn = auth.loggedIn;
            this.loggingIn = auth.loggingIn;
            this.error = auth.error;

            if (auth.error && !auth.sessionData) {
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
