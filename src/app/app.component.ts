import { AfterContentInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from './store/app-state';
import { LoggedInService } from './logged-in.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, AfterContentInit {
  constructor(
    private store: Store<AppState>,
    private router: Router,
    private loggedInService: LoggedInService
  ) { }
  title = 'app';

  ngOnInit() { }

  ngAfterContentInit() { }
}
