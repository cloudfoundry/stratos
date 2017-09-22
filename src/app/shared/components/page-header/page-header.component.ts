import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { ToggleSideNav } from './../../../store/actions/dashboard-actions';
import { AppState } from './../../../store/app-state';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {

  constructor(private store: Store<AppState>) { }


  // Assumes there will only ever be one header per page
  ngOnInit() {

  }

  toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

}
