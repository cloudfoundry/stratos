import { Router } from '@angular/router';
import { Login, VerifySession } from './store/actions/auth.actions';
import { AppState } from './store/app-state';
import { Store } from '@ngrx/store';
import { AfterContentInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, AfterContentInit {
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}
  title = 'app';

  ngOnInit() {}

  ngAfterContentInit() {}
}
