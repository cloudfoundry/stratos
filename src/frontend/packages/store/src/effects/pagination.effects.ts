import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  ADD_PARAMS,
  AddParams,
  REMOVE_PARAMS,
  RemoveParams,
  ResetPagination,
  SET_PARAMS,
  SetParams,
} from '../actions/pagination.actions';
import { AppState } from '../app-state';

@Injectable({
  providedIn: 'root'
})
export class PaginationEffects {
  private actions$ = inject(Actions);
  private store = inject<Store<AppState>>(Store);
  private appRef = inject(ApplicationRef);


   clearPaginationOnParamChange$ = createEffect(() => this.actions$.pipe(
    ofType<SetParams | AddParams | RemoveParams>(SET_PARAMS, ADD_PARAMS, REMOVE_PARAMS),
    map((action: SetParams | AddParams | RemoveParams) => {
      const addAction = action as AddParams;
      if (!addAction.keepPages) {
        this.store.dispatch(new ResetPagination(action.entityConfig, action.paginationKey));
        this.appRef.tick();
      }
    })), { dispatch: false });
}
