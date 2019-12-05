import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import {
  ADD_PARAMS,
  AddParams,
  REMOVE_PARAMS,
  RemoveParams,
  ResetPagination,
  SET_PARAMS,
  SetParams,
} from '../actions/pagination.actions';

@Injectable()
export class PaginationEffects {

  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>
  ) { }

  @Effect({ dispatch: false }) clearPaginationOnParamChange$ = this.actions$.pipe(
    ofType<SetParams | AddParams | RemoveParams>(SET_PARAMS, ADD_PARAMS, REMOVE_PARAMS),
    map(action => {
      const addAction = action as AddParams;
      if (!addAction.keepPages) {
        this.store.dispatch(new ResetPagination(action.entityConfig, action.paginationKey));
      }
    }));
}
