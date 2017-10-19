import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { ToggleSideNav } from './../../../store/actions/dashboard-actions';
import { AppState } from './../../../store/app-state';
import { Logout } from '../../../store/actions/auth.actions';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  ngOnInit() {

  }

  toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  logout() {
    this.store.dispatch(new Logout());
  }

}
