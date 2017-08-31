import { NgForm } from '@angular/forms/src/directives';
import { AppState } from './../store/app-state';
import { Store } from '@ngrx/store';
import { Login } from '../store/actions/auth.actions';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  loginForm: NgForm;

  username: string;
  password: string;

  loggedIn: boolean;
  loggingIn: boolean;
  error: boolean;

  ngOnInit() {
    this.store.select('auth')
    .subscribe(state => {
      this.loggedIn = state.loggedIn;
      this.loggingIn = state.loggingIn;
      this.error = state.error;
    });
  }


  login() {
    this.store.dispatch(new Login(this.username, this.password));
  }

}
