
import { first, map } from 'rxjs/operators';


import { Injectable } from '@angular/core';
import { ActivatedRoute, CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { RouterNav } from '../store/actions/router.actions';
import { AppState } from '../store/app-state';
import { AuthState } from '../store/reducers/auth.reducer';

export function queryParamMap() {
  const paramMap = {};
  const query = window.location.search.substring(1);
  if (query.length === 0) {
    return paramMap;
  }
  const vars = query.split('&');
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    paramMap[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return paramMap;
}

@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  canActivate(): Observable<boolean> {
    return this.store.select('auth').pipe(
      map((state: AuthState) => {
        if (!state.sessionData || !state.sessionData.valid) {
          this.store.dispatch(new RouterNav({
            path: ['/login']
          }, {
              path: window.location.pathname,
              queryParams: queryParamMap()
            }));
          return false;
        }
        return true;
      }), first(), );
  }

}
