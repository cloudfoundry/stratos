import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { pathGet, UtilsService } from '../../core/utils.service';
import { RequestTypes } from '../actions/request.actions';
import { AppState } from '../app-state';
import { validateEntityRelations } from '../helpers/entity-relations.helpers';
import { WrapperRequestActionSuccess } from '../types/request.types';

@Injectable()
export class RequestEffect {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private utils: UtilsService
  ) { }

  /**
   * Ensure all required inline parameters specified by the entity associated with the request exist.
   * If the inline parameter/s are..
   * - missing - dispatch an action to fetch them and ultimately store in a pagination. This will also populate the parent entities inline
   * parameter (see the generic request data reducer).
   * - exist - dispatch an action to store them in pagination.
   *
   * @memberof RequestEffect
   */
  @Effect({ dispatch: false }) requestSuccess$ = this.actions$.ofType<WrapperRequestActionSuccess>(RequestTypes.SUCCESS)
    .map(action => {
      // const response = action.response;
      // if (!response) {
      //   return;
      // }

      // const entities = Object.values(pathGet(`entities.${action.apiAction.entityKey}`, response) || {});
      // validateEntityRelations(
      //   this.store,
      //   action.apiAction,
      //   entities,
      //   false,
      //   true
      // );
    });

}
