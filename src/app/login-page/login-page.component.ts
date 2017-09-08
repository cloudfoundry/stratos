import { AuthState } from './../store/reducers/auth.reducer';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { NgForm } from '@angular/forms/src/directives';
import { AppState } from './../store/app-state';
import { Store } from '@ngrx/store';
import { Login } from '../store/actions/auth.actions';
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

  subscription: Subscription;

  ngOnInit() {
    this.subscription =
      this.store.select('auth')
      .subscribe((state: AuthState) => {
        if (state.loggedIn && state.sessionData && state.sessionData.valid) {
          this.router.navigateByUrl('');
        } else {
          this.loggedIn = state.loggedIn;
          this.loggingIn = state.loggingIn;
          this.error = state.error;
        }
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  login() {
    this.store.dispatch(new Login(this.username, this.password));
  }

}
