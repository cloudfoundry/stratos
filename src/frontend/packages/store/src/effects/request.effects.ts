import { Injectable } from '@angular/core';
import { RequestMethod } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, first, map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { validateEntityRelations } from '../../../cloud-foundry/src/entity-relations/entity-relations';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { LoggerService } from '../../../core/src/core/logger.service';
import { UtilsService } from '../../../core/src/core/utils.service';
import { ClearPaginationOfEntity, ClearPaginationOfType, SET_PAGE_BUSY } from '../actions/pagination.actions';
import {
  APIResponse,
  EntitiesPipelineActionTypes,
  EntitiesPipelineCompleted,
  ValidateEntitiesStart,
} from '../actions/request.actions';
import {
  completeApiRequest,
  getFailApiRequestActions,
  getRequestTypeFromMethod,
} from '../reducers/api-request-reducer/request-helpers';
import { rootUpdatingKey } from '../reducers/api-request-reducer/types';
import { getAPIRequestDataState } from '../selectors/api.selectors';
import { getPaginationState } from '../selectors/pagination.selectors';
import { UpdateCfAction } from '../types/request.types';

@Injectable()
export class RequestEffect {
  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
    private utils: UtilsService,
    private logger: LoggerService,
  ) { }

  // This block may come back, keeping just in case
  // @Effect() fetchEntities$ = this.actions$.ofType<FetchEntities>(EntitiesPipelineActionTypes.FETCH).pipe(
  //   mergeMap((action): Action[] => {
  //     const fetchAction: FetchEntities = action;
  //     const guids = fetchAction.config.guids();
  //     if (guids && this.canValidateAction(fetchAction.action)) {
  //       return [new ValidateEntitiesStart(
  //         fetchAction.action,
  //         guids,
  //         fetchAction.haveStarted
  //       )];
  //     } else {
  //       return fetchAction.config.shouldFetch() ? [fetchAction.action] : [];
  //     }
  //   })
  // );

  /**
   * Ensure all required inline parameters specified by the entity associated with the request exist.
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
   *
   */
  // TODO Move this into Cf - #3769
  @Effect() validateEntities$ = this.actions$.pipe(
    ofType<ValidateEntitiesStart>(EntitiesPipelineActionTypes.VALIDATE),
    mergeMap(action => {
      const validateAction: ValidateEntitiesStart = action;
      const apiAction = validateAction.action;
      const requestType = getRequestTypeFromMethod(apiAction);

      const apiResponse = validateAction.apiResponse;

      return this.store.select(getAPIRequestDataState).pipe(
        withLatestFrom(this.store.select(getPaginationState)),
        first(),
        map(([allEntities, allPagination]) => {
          return apiAction.skipValidation ? {
            started: false,
            completed: Promise.resolve(apiResponse),
          } : validateEntityRelations({
            cfGuid: validateAction.action.endpointGuid,
            store: this.store,
            allEntities,
            allPagination,
            apiResponse,
            action: validateAction.action,
            parentEntities: validateAction.validateEntities,
            populateMissing: true
          });
        }),
        mergeMap(validation => {
          const independentUpdates = !validateAction.apiRequestStarted && validation.started;
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
          return [new EntitiesPipelineCompleted(
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
          if (validateAction.apiRequestStarted) {
            return getFailApiRequestActions(apiAction, error, requestType, entityCatalogue.getEntity(apiAction));
          } else {
            this.update(apiAction, false, error.message);
            return [];
          }
        }));
    })
  );

  @Effect() completeEntities$ = this.actions$.pipe(
    ofType<EntitiesPipelineCompleted>(EntitiesPipelineActionTypes.COMPLETE),
    mergeMap(action => {
      const completeAction: EntitiesPipelineCompleted = action;
      const actions = [];
      if (!completeAction.validateAction.apiRequestStarted && completeAction.validationResult.started) {
        if (completeAction.independentUpdates) {
          this.update(completeAction.apiAction, false, null);
        }
      } else if (completeAction.validateAction.apiRequestStarted) {
        const apiAction = completeAction.apiAction;
        const requestType = getRequestTypeFromMethod(apiAction);
        const apiResponse: APIResponse = completeAction.apiResponse || {
          response: null,
          totalPages: 0,
          totalResults: 0,
        };

        completeApiRequest(this.store, apiAction, apiResponse, requestType);

        if (
          !apiAction.updatingKey &&
          (apiAction.options.method === 'post' || apiAction.options.method === RequestMethod.Post ||
            apiAction.options.method === 'delete' || apiAction.options.method === RequestMethod.Delete)
        ) {
          // FIXME: Look at using entity config instead of actions in these actions ctors
          if (apiAction.removeEntityOnDelete) {
            actions.unshift(new ClearPaginationOfEntity(apiAction, apiAction.guid));
          } else {
            actions.unshift(new ClearPaginationOfType(apiAction));
          }

          if (Array.isArray(apiAction.clearPaginationEntityKeys)) {
            // If clearPaginationEntityKeys is an array then clear the pagination sections regardless of removeEntityOnDelete
            actions.push(...apiAction.clearPaginationEntityKeys.map(key => new ClearPaginationOfType(apiAction)));
          }
        }
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
