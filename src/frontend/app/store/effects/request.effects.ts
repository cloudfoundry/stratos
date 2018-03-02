import { rootUpdatingKey } from '../reducers/api-request-reducer/types';
import { Injectable } from '@angular/core';
import { RequestMethod } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { first, map, mergeMap } from 'rxjs/operators';

import { LoggerService } from '../../core/logger.service';
import { UtilsService } from '../../core/utils.service';
import { ClearPaginationOfEntity, ClearPaginationOfType } from '../actions/pagination.actions';
import {
  APIResponse,
  EntitiesPipelineCompleted,
  EntitiesPipelineActionTypes,
  FetchEntities,
  ValidateEntitiesStart,
  RequestTypes,
} from '../actions/request.actions';
import { AppState } from '../app-state';
import { validateEntityRelations, ValidationResult } from '../helpers/entity-relations.helpers';
import { getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import { getAPIRequestDataState } from '../selectors/api.selectors';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess, UpdateCfAction } from '../types/request.types';

@Injectable()
export class RequestEffect {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private utils: UtilsService,
    private logger: LoggerService,
  ) { }


  // TODO: RC DELETE
  @Effect() fetchEntities$ = this.actions$.ofType<FetchEntities>(EntitiesPipelineActionTypes.FETCH).pipe(
    mergeMap((action): Action[] => {
      const fetchAction: FetchEntities = action;
      const guids = fetchAction.config.guids();
      if (guids && this.canValidateAction(fetchAction.action)) {
        return [new ValidateEntitiesStart(
          fetchAction.action,
          guids,
          fetchAction.haveStarted
        )];
      } else {
        return fetchAction.config.shouldFetch() ? [fetchAction.action] : [];
      }
    })
  );

  @Effect() validateEntities$ = this.actions$.ofType<ValidateEntitiesStart>(EntitiesPipelineActionTypes.VALIDATE).pipe(
    mergeMap(action => {
      const validateAction: ValidateEntitiesStart = action;
      const apiAction = validateAction.action;
      const requestType = getRequestTypeFromMethod(apiAction.options.method);

      const apiResponse = validateAction.apiResponse;
      const allEntities$ = apiResponse ?
        Observable.of(apiResponse.response.entities) :
        this.store.select(getAPIRequestDataState).first();

      return allEntities$.pipe(
        first(),
        map(allEntities => {
          // this.logger.debug(`${apiAction['paginationKey']} - re - validateEntities - validateEntityRelations`);
          return validateEntityRelations(
            validateAction.action.endpointGuid,
            this.store,
            allEntities,
            validateAction.action,
            validateAction.validateEntities,
            true,
            validateAction.apiRequestStarted); // TODO: RC only populate missing if from api request, otherwise we've already popualted missing
        }),
        mergeMap(validation => {
          if (!validateAction.apiRequestStarted && validation.started) {
            // this.logger.debug(`${apiAction['paginationKey']} - re - validateEntities - StartRequestAction`);
            if (apiAction['paginationKey']) {

            } else {
              this.store.dispatch({
                type: RequestTypes.START,
                apiAction: {
                  ...apiAction,
                  updatingKey: rootUpdatingKey
                }
              });
            }
            // this.store.dispatch(new StartRequestAction(apiAction, requestType));
            // this.store.dispatch({ type: apiAction.actions[0] });


          }
          return validation.completed$.pipe(
            map(() => validation)
          );
        }),
        mergeMap((validationResult: ValidationResult) => {
          return [new EntitiesPipelineCompleted(
            apiAction,
            apiResponse,
            validateAction,
            validationResult
          )];
          // this.logger.debug(`${apiAction['paginationKey']} - re - validateEntities -  ${validateAction.haveStarted || validation.started}`);
        })
      ).catch(error => {
        this.logger.warn(`Entity validation process failed`, error);
        return [
          { type: apiAction.actions[2], apiAction: apiAction },
          new WrapperRequestActionFailed(
            error.message,
            apiAction,
            requestType
          )
        ];
      });
    })
  );

  @Effect() completeEntities$ = this.actions$.ofType<EntitiesPipelineCompleted>(EntitiesPipelineActionTypes.COMPLETE).pipe(
    mergeMap(action => {
      const completeAction: EntitiesPipelineCompleted = action;

      const actions = [];
      if (completeAction.validationResult.started) {
        if (completeAction.apiAction['paginationKey']) {

        } else {
          actions.push({
            type: RequestTypes.SUCCESS,
            apiAction: {
              ...completeAction.apiAction,
              updatingKey: rootUpdatingKey
            }
          });
        }


      } else if (completeAction.validateAction.apiRequestStarted) {

        const apiAction = completeAction.apiAction;
        const requestType = getRequestTypeFromMethod(apiAction.options.method);
        const apiResponse: APIResponse = completeAction.apiResponse || {
          response: null,
          totalPages: 0,
          totalResults: 0,
        };

        actions.push({ type: apiAction.actions[1], apiAction: apiAction });
        actions.push(new WrapperRequestActionSuccess(
          apiResponse.response,
          apiAction,
          requestType,
          apiResponse.totalResults,
          apiResponse.totalPages
        ));

        if (
          !apiAction.updatingKey &&
          apiAction.options.method === 'post' || apiAction.options.method === RequestMethod.Post ||
          apiAction.options.method === 'delete' || apiAction.options.method === RequestMethod.Delete
        ) {
          if (apiAction.removeEntityOnDelete) {
            actions.unshift(new ClearPaginationOfEntity(apiAction.entityKey, apiAction.guid));
          } else {
            actions.unshift(new ClearPaginationOfType(apiAction.entityKey));
          }
        }
      }

      return actions;
    }));


  canValidateAction = (object) => {
    return false; // object['entity'];// TODO: RC
  }

}



  // TODO: RC Junk
  /**
   * Ensure all required inline parameters specified by the entity associated with the request exist.
   * If the inline parameter/s are..
   * - missing - dispatch an action to fetch them and ultimately store in a pagination. This will also populate the parent entities inline
   * parameter (see the generic request data reducer).
   * - exist - dispatch an action to store them in pagination.
   *
   * @memberof RequestEffect
   */
