import { Injectable } from '@angular/core';
import { RequestMethod } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { first, map, mergeMap, tap } from 'rxjs/operators';

import { UtilsService } from '../../core/utils.service';
import { ClearPaginationOfEntity, ClearPaginationOfType } from '../actions/pagination.actions';
import { CompleteEntities, EntitiesPipelineActionTypes, FetchEntities, ValidateEntities } from '../actions/request.actions';
import { AppState } from '../app-state';
import { validateEntityRelations } from '../helpers/entity-relations.helpers';
import { getRequestTypeFromMethod } from '../reducers/api-request-reducer/request-helpers';
import { getAPIRequestDataState } from '../selectors/api.selectors';
import { StartRequestAction, WrapperRequestActionSuccess, WrapperRequestActionFailed } from '../types/request.types';
import { LoggerService } from '../../core/logger.service';

@Injectable()
export class RequestEffect {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private utils: UtilsService,
    private logger: LoggerService,
  ) { }

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

  @Effect() fetchEntities$ = this.actions$.ofType<FetchEntities>(EntitiesPipelineActionTypes.FETCH).pipe(
    map(action => {
      const fetchAction: FetchEntities = action;
      const guids = fetchAction.config.guids();
      if (guids) {
        // const state = {
        //   [fetchAction.action.entityKey]
        // }
        return new ValidateEntities(
          fetchAction.action,
          guids,
          fetchAction.haveStarted
        );
      } else {
        return fetchAction.config.shouldFetch() ? fetchAction.action : null;
      }
    })
  );

  @Effect() validateEntities$ = this.actions$.ofType<ValidateEntities>(EntitiesPipelineActionTypes.VALIDATE).pipe(
    mergeMap(action => {
      const validateAction: ValidateEntities = action;
      const apiAction = validateAction.action;
      const requestType = getRequestTypeFromMethod(apiAction.options.method);

      const allEntities$ = validateAction.apiResponse ?
        Observable.of(validateAction.apiResponse.response.entities) :
        this.store.select(getAPIRequestDataState);

      return allEntities$.pipe(
        first(),
        map(allEntities => {
          console.log('STARTING: ', validateAction.action);
          return validateEntityRelations(
            this.store,
            allEntities,
            validateAction.action,
            validateAction.validateEntities,
            true,
            true);
        }),
        mergeMap(validation => {
          if (!validateAction.haveStarted && validation.started) {
            this.store.dispatch(new StartRequestAction(apiAction, requestType));
            this.store.dispatch({ type: apiAction.actions[0] });
          }
          return validation.completed$;
        }),
        mergeMap(validationCompleted => {
          console.log('COMPLETED: ', validateAction.action);
          return [new CompleteEntities(
            apiAction,
            validateAction.apiResponse
          )];
        })
      ).catch(error => {
        this.logger.warn(`Entity validation process failed ${error}`);
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

  @Effect() completeEntities$ = this.actions$.ofType<CompleteEntities>(EntitiesPipelineActionTypes.COMPLETE).pipe(
    mergeMap(action => {
      const completeAction: CompleteEntities = action;
      const apiAction = completeAction.action;
      const requestType = getRequestTypeFromMethod(apiAction.options.method);
      const apiResponse = completeAction.apiResponse || {};

      const actions = [];
      actions.push({ type: apiAction.actions[1], apiAction: apiAction });
      actions.push(new WrapperRequestActionSuccess(
        completeAction.apiResponse.response,
        apiAction,
        requestType,
        completeAction.apiResponse.totalResults,
        completeAction.apiResponse.totalPages
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
      return actions;
    }));
}
