import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';

import { RouterActions, RouterNav } from '../actions/router.actions';



@Injectable({
  providedIn: 'root'
})
export class RouterEffect {
  private actions$ = inject(Actions);
  private router = inject(Router);


  
  routerGoUrl$ = createEffect(() => this.actions$.pipe(
    ofType<RouterNav>(RouterActions.GO),
    map((action: RouterNav) => action.payload),
    tap(({ path, query: queryParams, extras = {} }: { path: any; query: any; extras?: any }) => {
      const extraParams = { ...extras, queryParams };
      if (typeof path === 'string') {
        path = path.split('/');
      }
      this.router.navigate(path, extraParams);
      // Removed manual tick() call - zoneless change detection handles this automatically
    })), { dispatch: false });
}
