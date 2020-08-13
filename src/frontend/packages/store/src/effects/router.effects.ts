import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';

import { RouterActions, RouterNav } from '../actions/router.actions';



@Injectable()
export class RouterEffect {

  constructor(
    private actions$: Actions,
    private router: Router
  ) { }

  @Effect({ dispatch: false })
  routerGoUrl$ = this.actions$.pipe(
    ofType<RouterNav>(RouterActions.GO),
    map((action: RouterNav) => action.payload),
    tap(({ path, query: queryParams, extras = {} }) => {
      const extraParams = { ...extras, queryParams };
      if (typeof path === 'string') {
        path = path.split('/');
      }
      this.router.navigate(path, extraParams);
    }));
}
