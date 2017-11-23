import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Logout } from '../../store/actions/auth.actions';
import { AppState } from '../../store/app-state';

@Component({
  selector: 'app-no-endpoints-non-admin',
  templateUrl: './no-endpoints-non-admin.component.html',
  styleUrls: ['./no-endpoints-non-admin.component.scss']
})
export class NoEndpointsNonAdminComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
  }

  logout() {
    this.store.dispatch(new Logout());
  }

}
