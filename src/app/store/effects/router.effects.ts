import { GoToState, RouterActions } from '../actions/router.actions';
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

  @Effect({ dispatch: false }) routerGoUrl$ = this.actions$.ofType<GoToState>(RouterActions.GO)
    .map((apiAction: GoToState) => {
      this.router.navigateByUrl(apiAction.url);
    });
}

