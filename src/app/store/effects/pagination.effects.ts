import { register } from 'ts-node/dist';
import { Observable } from 'rxjs/Rx';
import { GET_CNSIS, GetAllCNSIS, GetAllCNSISFailed, GetAllCNSISSuccess } from './../actions/cnsis.actions';
import { AppState } from './../app-state';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import {
  ADD_PARAMS,
  AddParams,
  ClearPagination,
  REMOVE_PARAMS,
  RemoveParams,
  SET_PARAMS,
  SetParams,
} from '../actions/pagination.actions';


@Injectable()
export class PaginationEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() clearPaginationOnParamChange$ =
  this.actions$.ofType<SetParams | AddParams | RemoveParams>(SET_PARAMS, ADD_PARAMS, REMOVE_PARAMS)
    .map(action => {
      return new ClearPagination(action.entityKey, action.paginationKey);
    });
}
