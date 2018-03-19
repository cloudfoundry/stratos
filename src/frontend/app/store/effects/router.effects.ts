import { RouterNav, RouterActions } from '../actions/router.actions';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';


@Injectable()
export class RouterEffect {

  constructor(
    private actions$: Actions,
    private router: Router
  ) { }

  @Effect({ dispatch: false })
  routerGoUrl$ = this.actions$.ofType<RouterNav>(RouterActions.GO)
    .map((action: RouterNav) => action.payload)
    .do(({ path, query: queryParams, extras = {} }) => {
      const extraParams = { ...extras, queryParams };
      if (typeof path === 'string') {
        path = path.split('/');
      }
      this.router.navigate(path, extraParams);
    });
}
