import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { SET_CLIENT_FILTER, SetClientFilter, SetClientPage } from '../actions/pagination.actions';
import { InternalAppState } from '../app-state';


@Injectable()
export class SetClientFilterEffect {

  constructor(
    private actions$: Actions,
    private store: Store<InternalAppState>,
  ) { }

  @Effect({ dispatch: false }) clearPageNumber$ = this.actions$.pipe(
    ofType<SetClientFilter>(SET_CLIENT_FILTER),
    map(action => {
      // We reset the page when a param is changed.
      this.store.dispatch(new SetClientPage(action.entityConfig, action.paginationKey, 1));
    }));
}

