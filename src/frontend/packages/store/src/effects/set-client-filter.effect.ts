import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { SET_CLIENT_FILTER, SetClientFilter, SetClientPage } from '../actions/pagination.actions';



@Injectable()
export class SetClientFilterEffect {

  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
  ) { }

  @Effect({ dispatch: false }) clearPageNumber$ = this.actions$.pipe(
    ofType<SetClientFilter>(SET_CLIENT_FILTER),
    map(action => {
      // We reset the page when a param is changed.
      this.store.dispatch(new SetClientPage(action.entityConfig, action.paginationKey, 1));
    }));
}

