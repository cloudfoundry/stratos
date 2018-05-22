import 'rxjs/add/operator/skipWhile';

import { Injectable } from '@angular/core';
import { ActivatedRoute, CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { RouterNav } from '../store/actions/router.actions';
import { AppState } from '../store/app-state';
import { AuthState } from '../store/reducers/auth.reducer';

@Injectable()
export class AuthGuardService implements CanActivate {

  queryParamMap() {
    const map = {};
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return map;
  }

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  canActivate(): Observable<boolean> {
    return this.store.select('auth')
      .map((state: AuthState) => {
        if (!state.sessionData || !state.sessionData.valid) {
          this.store.dispatch(new RouterNav({
            path: ['/login']
          }, {
              path: window.location.pathname,
              queryParams: this.queryParamMap()
            }));
          return false;
        }
        return true;
      }).first();
  }

}
