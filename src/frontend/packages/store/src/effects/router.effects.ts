
import {tap, map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Effect } from '@ngrx/effects';

import { RouterActions, RouterNav } from '../actions/router.actions';


@Injectable()
export class RouterEffect {

  constructor(
    private actions$: Actions,
    private router: Router
  ) { }

  @Effect({ dispatch: false })
  routerGoUrl$ = this.actions$.ofType<RouterNav>(RouterActions.GO).pipe(
    map((action: RouterNav) => action.payload),
    tap(({ path, query: queryParams, extras = {} }) => {
      const extraParams = { ...extras, queryParams };
      if (typeof path === 'string') {
        path = path.split('/');
      }
      this.router.navigate(path, extraParams);
    }), );
}
