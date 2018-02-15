import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { UtilsService, pathGet } from '../../core/utils.service';
import { EntityWithInline, EntityValidateInline } from '../actions/action-types';
import { SetInitialParams } from '../actions/pagination.actions';
import { RequestTypes } from '../actions/request.actions';
import { AppState } from '../app-state';
import { pick } from '../helpers/reducer.helper';
import { WrapperRequestActionSuccess } from '../types/request.types';

@Injectable()
export class RequestEffect {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private utils: UtilsService
  ) { }

  /**
   * Ensure all require parameters specified in the entity exist, or if not dispatch an action to fetch them and store in a pagination
   * sections. For they exist ensure there is a pagination section for them
   * We also guarentee the parameter will be populated once the action is returned. See ???????????TODO:
   *
   * @memberof RequestEffect
   */
  @Effect() requestSuccess$ = this.actions$.ofType<WrapperRequestActionSuccess>(RequestTypes.SUCCESS)
    .mergeMap(action => {
      // Does the entity associated with the action have inline params that need to be validated?
      const entity = pathGet('action.apiAction.entity', action) || {};
      const entityWithInline = entity as EntityWithInline;
      const validateInlineEntities = entityWithInline.inlineValidation;
      if (!validateInlineEntities || validateInlineEntities.length) {
        return [];
      }

      // Do we have entities in the response?
      const response = action.response;
      let entities = pathGet(`entities.${action.apiAction.entityKey}`, response) || {};
      entities = Object.values(entities);
      if (!entities || !entities.length) {
        return [];
      }

      // Confirm that all the required parameters exist in the response
      let actions = [];
      entities.forEach(entity => {
        validateInlineEntities.filter(validateParam => validateParam instanceof EntityValidateInline).forEach(validateParam => {
          const validateParent = validateParam as EntityValidateInline;
          const paramAction = validateParent.createAction(entity);
          const paramValue = pathGet(validateParent.path, entity);
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
