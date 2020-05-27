import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, first, map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { LoggerService } from '../../../../core/src/core/logger.service';
import { SET_PAGE_BUSY } from '../../../../store/src/actions/pagination.actions';
import { rootUpdatingKey } from '../../../../store/src/reducers/api-request-reducer/types';
import { getAPIRequestDataState } from '../../../../store/src/selectors/api.selectors';
import { getPaginationState } from '../../../../store/src/selectors/pagination.selectors';
import { UpdateCfAction } from '../../../../store/src/types/request.types';
import {
  CfValidateEntitiesComplete,
  CfValidateEntitiesStart,
  EntitiesPipelineActionTypes,
} from '../../actions/relations-actions';
import { CFAppState } from '../../cf-app-state';
import { validateEntityRelations } from '../../entity-relations/entity-relations';

/**
 * Now purely looks after ad-hoc validation of an entity or list of entities
 * Does not link in to the API request chain (see new location in success-entity-request.handler)
 */
@Injectable()
export class CfValidateEffects {
  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
    private logger: LoggerService,
  ) { }

  /**
   * Ensure all required inline parameters specified by the entity/s associated with the request exist.
   * If the inline parameter/s are..
   * - missing - dispatch an action to fetch them and, if a list, store in a pagination. This will also populate the parent entities inline
   * parameter (see the generic request data reducer).
   * - exist - if a list, dispatch an action to store them in pagination.
   * For example
   * 1) a space may require routes
   * 2) space is fetched as part of a different call that has not requested a space's routes be fetched inline
   * 3) this validation process will check each space, and if routes are missing fetch them
   * 4) routes list is then stored in original space and as a pagination section
   * 5) alternatively... if we've reached here for the same space but from an api request for that space.. ensure that the routes have not
   *    been dropped because their count is over 50
   */
  @Effect() validateEntities$ = this.actions$.pipe(
    ofType<CfValidateEntitiesStart>(EntitiesPipelineActionTypes.VALIDATE),
    mergeMap(action => {
      const validateAction: CfValidateEntitiesStart = action;
      const apiAction = validateAction.action;

      return this.store.select(getAPIRequestDataState).pipe(
        withLatestFrom(this.store.select(getPaginationState)),
        first(),
        map(([allEntities, allPagination]) => {
          return apiAction.skipValidation ? {
            started: false,
            completed: Promise.resolve(null),
          } : validateEntityRelations({
            cfGuid: validateAction.action.endpointGuid,
            store: this.store,
            allEntities,
            allPagination,
            apiResponse: null,
            action: validateAction.action,
            parentEntities: validateAction.validateEntities,
            populateMissing: true
          });
        }),
        mergeMap(validation => {
          const independentUpdates = validation.started;
          if (independentUpdates) {
            this.update(apiAction, true, null);
          }
          return validation.completed.then(validatedApiResponse => ({
            validatedApiResponse,
            independentUpdates,
            validation
          }));
        }),
        mergeMap(({ validatedApiResponse, independentUpdates, validation }) => {
          return [new CfValidateEntitiesComplete(
            apiAction,
            validatedApiResponse,
            validateAction,
            validation,
            independentUpdates
          )];
        })
      )
        .pipe(catchError(error => {
          this.logger.warn(`Entity validation process failed`, error);
          this.update(apiAction, false, error.message);
          return [];
        }));
    })
  );

  @Effect() completeEntities$ = this.actions$.pipe(
    ofType<CfValidateEntitiesComplete>(EntitiesPipelineActionTypes.COMPLETE),
    mergeMap(action => {
      const completeAction: CfValidateEntitiesComplete = action;
      const actions = [];
      if (completeAction.validationResult.started && completeAction.independentUpdates) {
        this.update(completeAction.apiAction, false, null);
      }
      return actions;
    }));


  update(apiAction, busy: boolean, error: string) {
    if (apiAction.paginationKey) {
      this.store.dispatch({
        type: SET_PAGE_BUSY,
        busy,
        error,
        apiAction
      });
    } else {
      const newAction = {
        ...apiAction,
      };
      if (busy) {
        newAction.updatingKey = rootUpdatingKey;
      }
      this.store.dispatch(new UpdateCfAction(newAction, busy, error));
    }
  }

}
