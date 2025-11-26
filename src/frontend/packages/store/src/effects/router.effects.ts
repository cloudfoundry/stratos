import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';

import { type IRouterNavPayload, RouterActions, type RouterNav } from '../actions/router.actions';



@Injectable({
  providedIn: 'root'
})
export class RouterEffect {

  constructor(
    private actions$: Actions,
    private router: Router,
  ) { }

  
  routerGoUrl$ = createEffect(() => this.actions$.pipe(
    ofType<RouterNav>(RouterActions.GO),
    map((action: RouterNav) => action.payload),
    tap((payload: IRouterNavPayload) => {
      const { path, query: queryParams, extras = {} } = payload;
      const extraParams = { ...extras, queryParams };
      const pathArray = typeof path === 'string' ? path.split('/') : path;
      this.router.navigate(pathArray, extraParams);
      // Removed manual tick() call - zoneless change detection handles this automatically
    })), { dispatch: false });
}
