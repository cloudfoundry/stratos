import { AppState } from '../app-state';
import {
  AddParams,
  SET_CLIENT_FILTER,
  SetParams,
  ADD_PARAMS,
  SET_PARAMS,
  ResetPagination,
  ClearPages
} from '../actions/pagination.actions';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';


@Injectable()
export class SetAPIFilterEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect({ dispatch: false }) clearPages$ = this.actions$.ofType<AddParams | SetParams>(ADD_PARAMS, SET_PARAMS)
    .map(action => {
      if (!action.keepPages) {
        // We reset the page when a param is changed.
        this.store.dispatch(new ClearPages(action.entityKey, action.paginationKey));
      }
    });
}

