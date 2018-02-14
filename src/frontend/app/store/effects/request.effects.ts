import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { RequestSuccessAction, IRequestAction, WrapperRequestActionSuccess } from '../types/request.types';
import { RequestTypes } from '../actions/request.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { UtilsService } from '../../core/utils.service';
import { SetInitialParams } from '../actions/pagination.actions';
import { pick } from '../helpers/reducer.helper';

@Injectable()
export class RequestEffect {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private utils: UtilsService
  ) { }

  @Effect() requestSuccess$ = this.actions$.ofType<WrapperRequestActionSuccess>(RequestTypes.SUCCESS)
    .mergeMap(action => {
      const validateResponse = action.apiAction.validateResponse;
      const response = action.response;
      let entities;
      if (validateResponse) {
        entities = this.utils.path(`entities.${action.apiAction.entityKey}`, response) || {};
        entities = Object.values(entities);
      }

      if (!entities || !entities.length) {
        return [];
      }

      let actions = [];
      entities.forEach(entity => {
        validateResponse.forEach(validateParam => {
          const paramAction = validateParam.createAction(entity);
          const paramValue = this.utils.path(validateParam.path, entity);
          if (paramValue) {
            // We've got the value already, ensure we create a pagination section for them
            const paramEntities = pick(response.entities[paramAction.entityKey], paramValue);
            const paginationSuccess = new WrapperRequestActionSuccess(
              {
                entities: {
                  [paramAction.entityKey]: paramEntities
                },
                result: paramValue
              },
              paramAction,
              'fetch',
              paramValue.length,
              1
            );
            actions.push(paginationSuccess);
          } else {
            // The values are missing, go fetch
            actions = [].concat(actions, [
              new SetInitialParams(paramAction.entityKey, paramAction.paginationKey, paramAction.initialParams, true),
              paramAction
            ]);
          }
        });
      });

      return actions;
    });

}
