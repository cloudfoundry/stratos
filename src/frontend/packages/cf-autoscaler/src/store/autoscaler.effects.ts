import type { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { type Actions, createEffect, ofType } from '@ngrx/effects';
import type { Action } from '@ngrx/store';
import type { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { catchError, mergeMap, withLatestFrom } from 'rxjs/operators';

import type { PaginationResponse } from '../../../cloud-foundry/src/store/types/cf-api.types';
import { environment } from '@stratosui/core';
import {
  type AppState,
  entityCatalog,
  isHttpErrorResponse,
  type ApiRequestTypes,
  selectPaginationState,
  type APIResource,
  type NormalizedResponse,
  type PaginatedAction,
  type PaginationEntityState,
  type PaginationParam,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
  resultPerPageParam,
  resultPerPageParamDefault
} from '@stratosui/store';
import { buildMetricData } from '../core/autoscaler-helpers/autoscaler-transform-metric';
import {
  autoscalerTransformArrayToMap,
  autoscalerTransformMapToArray,
} from '../core/autoscaler-helpers/autoscaler-transform-policy';
import { AutoscalerConstants } from '../core/autoscaler-helpers/autoscaler-util';
import {
  APP_AUTOSCALER_HEALTH,
  APP_AUTOSCALER_POLICY,
  APP_AUTOSCALER_POLICY_TRIGGER,
  APP_AUTOSCALER_SCALING_HISTORY,
  AUTOSCALER_INFO,
  type AutoscalerPaginationParams,
  type AutoscalerQuery,
  CREATE_APP_AUTOSCALER_POLICY,
  type CreateAppAutoscalerPolicyAction,
  DELETE_APP_AUTOSCALER_CREDENTIAL,
  type DeleteAppAutoscalerCredentialAction,
  DETACH_APP_AUTOSCALER_POLICY,
  type DetachAppAutoscalerPolicyAction,
  FETCH_APP_AUTOSCALER_METRIC,
  type GetAppAutoscalerHealthAction,
  type GetAppAutoscalerInfoAction,
  type GetAppAutoscalerMetricAction,
  GetAppAutoscalerPolicyAction,
  type GetAppAutoscalerPolicyTriggerAction,
  type GetAppAutoscalerScalingHistoryAction,
  UPDATE_APP_AUTOSCALER_CREDENTIAL,
  UPDATE_APP_AUTOSCALER_POLICY,
  type UpdateAppAutoscalerCredentialAction,
  type UpdateAppAutoscalerPolicyAction,
} from './app-autoscaler.actions';
import type {
  AppAutoscalerCredential,
  AppAutoscalerEvent,
  AppAutoscalerFetchPolicyFailedResponse,
  AppAutoscalerMetricData,
  AppAutoscalerMetricDataLocal,
  AppAutoscalerPolicy,
  AppAutoscalerPolicyLocal,
  AppScalingTrigger,
} from './app-autoscaler.types';

const { proxyAPIVersion } = environment;
const commonPrefix = `/pp/${proxyAPIVersion}/autoscaler`;

function extractAutoscalerError(error: unknown): string {
  const httpResponse: HttpErrorResponse = isHttpErrorResponse(error);
  if (httpResponse) {
    return httpResponse.error ? httpResponse.error.error : JSON.stringify(httpResponse.error);
  }
  return (error as { _body?: string })._body ?? '';
}

function createAutoscalerErrorMessage(requestType: string, error: unknown): string {
  const status = (error as { status?: number }).status ?? '';
  return `Unable to ${requestType}: ${status} ${extractAutoscalerError(error) || ''}`;
}

@Injectable({
  providedIn: 'root'
})
export class AutoscalerEffects {
  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store,
  ) { }


  fetchAutoscalerInfo$ = createEffect(() => this.actions$.pipe(
    ofType<GetAppAutoscalerInfoAction>(AUTOSCALER_INFO),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http
        .get(`${commonPrefix}/info`, {
          headers: this.addHeaders(action.endpointGuid)
        }).pipe(
          mergeMap(autoscalerInfo => {
            const entityKey = entityCatalog.getEntityKey(action);
            const mappedData = {
              entities: { [entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entityKey, mappedData, action.endpointGuid, autoscalerInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            // 404/503 are expected when autoscaler is not configured or unavailable
            // Don't show error message to user, just mark as unavailable
            const isExpectedError = err.status === 404 || err.status === 503;
            const errorMessage = isExpectedError
              ? 'Autoscaler not available for this endpoint'
              : createAutoscalerErrorMessage('fetch autoscaler info', err);
            return [
              new WrapperRequestActionFailed(errorMessage, action, actionType)
            ];
          }));
    })));

  
  fetchAppAutoscalerHealth$ = createEffect(() => this.actions$.pipe(
    ofType<GetAppAutoscalerHealthAction>(APP_AUTOSCALER_HEALTH),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http
        .get(`${commonPrefix}/health`, {
          headers: this.addHeaders(action.endpointGuid)
        }).pipe(
          mergeMap(healthInfo => {
            const entity = entityCatalog.getEntity(action);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.endpointGuid, healthInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            // Gracefully handle autoscaler unavailability
            const isUnavailable = err.status === 404 || err.status === 503;
            const errorMessage = isUnavailable
              ? 'Autoscaler health check unavailable'
              : createAutoscalerErrorMessage('fetch health info', err);
            return [
              new WrapperRequestActionFailed(errorMessage, action, actionType)
            ];
          }));
    })));

  
  createAppAutoscalerPolicy$ = createEffect(() => this.actions$.pipe(
    ofType<CreateAppAutoscalerPolicyAction>(CREATE_APP_AUTOSCALER_POLICY),
    mergeMap(action => this.createUpdatePolicy(action))));

  
  updateAppAutoscalerPolicy$ = createEffect(() => this.actions$.pipe(
    ofType<UpdateAppAutoscalerPolicyAction>(UPDATE_APP_AUTOSCALER_POLICY),
    mergeMap(action => {
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http.put<AppAutoscalerPolicy>(
        `${commonPrefix}/apps/${action.guid}/policy`,
        autoscalerTransformMapToArray(action.policy),
        {
          headers: this.addHeaders(action.endpointGuid)
        }).pipe(
          mergeMap(response => {
            const policyInfo = autoscalerTransformArrayToMap(response);
            const entity = entityCatalog.getEntity(action);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, policyInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            return [
              new WrapperRequestActionFailed(createAutoscalerErrorMessage('update policy', err), action, actionType)
            ];
          }));
    })));

  
  getAppAutoscalerPolicy$ = createEffect(() => this.actions$.pipe(
    ofType<GetAppAutoscalerPolicyAction>(APP_AUTOSCALER_POLICY),
    mergeMap(action => this.fetchPolicy(action))
  ));

  
  detachAppAutoscalerPolicy$ = createEffect(() => this.actions$.pipe(
    ofType<DetachAppAutoscalerPolicyAction>(DETACH_APP_AUTOSCALER_POLICY),
    mergeMap(action => {
      const actionType = 'delete';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http
        .delete(`${commonPrefix}/apps/${action.guid}/policy`, {
          headers: this.addHeaders(action.endpointGuid)
        }).pipe(
          mergeMap(_response => {
            const entity = entityCatalog.getEntity(action);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, { enabled: false });
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            return [
              new WrapperRequestActionFailed(createAutoscalerErrorMessage('detach policy', err), action, actionType)
            ];
          }));
    })));

  
  fetchAppAutoscalerPolicyTrigger$ = createEffect(() => this.actions$.pipe(
    ofType<GetAppAutoscalerPolicyTriggerAction>(APP_AUTOSCALER_POLICY_TRIGGER),
    mergeMap(action => this.fetchPolicy(new GetAppAutoscalerPolicyAction(action.guid, action.endpointGuid), action))
  ));

  
  updateAppAutoscalerCredential$ = createEffect(() => this.actions$.pipe(
    ofType<UpdateAppAutoscalerCredentialAction>(UPDATE_APP_AUTOSCALER_CREDENTIAL),
    mergeMap(action => {
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http.put<AppAutoscalerCredential>(
        `${commonPrefix}/apps/${action.guid}/credential`,
        action.credential,
        {
          headers: this.addHeaders(action.endpointGuid)
        }).pipe(
          mergeMap(response => {
            const credentialInfo = response;
            const entity = entityCatalog.getEntity(action);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, credentialInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            return [
              new WrapperRequestActionFailed(createAutoscalerErrorMessage('update credential', err), action, actionType)
            ];
          }));
    })));

  
  deleteAppAutoscalerCredential$ = createEffect(() => this.actions$.pipe(
    ofType<DeleteAppAutoscalerCredentialAction>(DELETE_APP_AUTOSCALER_CREDENTIAL),
    mergeMap(action => {
      const actionType = 'delete';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http
        .delete(`${commonPrefix}/apps/${action.guid}/credential`, {
          headers: this.addHeaders(action.endpointGuid)
        }).pipe(
          mergeMap(_response => {
            const entity = entityCatalog.getEntity(action);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, { enabled: false });
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            return [
              new WrapperRequestActionFailed(createAutoscalerErrorMessage('delete credential', err), action, actionType)
            ];
          }));
    })));

  
  fetchAppAutoscalerScalingHistory$ = createEffect(() => this.actions$.pipe(
    ofType<GetAppAutoscalerScalingHistoryAction>(APP_AUTOSCALER_SCALING_HISTORY),
    withLatestFrom(this.store),
    mergeMap(([action, state]) => {
      const actionType = 'fetch';
      const paginatedAction = action as PaginatedAction;
      this.store.dispatch(new StartRequestAction(action, actionType));
      const entity = entityCatalog.getEntity(action);
      // Set params from store
      const paginationState = selectPaginationState(
        entity.entityKey,
        paginatedAction.paginationKey,
      )(state);
      const paginationParams = this.getPaginationParams(paginationState);
      paginatedAction.pageNumber = paginationState
        ? paginationState.currentPage
        : 1;
      const { metricConfig, ...trimmedPaginationParams } = paginationParams;
      const params = this.buildParams(action.initialParams, trimmedPaginationParams, action.params);
      if (!params[resultPerPageParam]) {
        params[resultPerPageParam] = resultPerPageParamDefault.toString();
      }
      const {
        "order-direction-field": removed,
        ...cleanParams
      } = params;

      return this.http
        .get<PaginationResponse<AppAutoscalerEvent>>(`${commonPrefix}/apps/${action.guid}/event`, {
          headers: this.addHeaders(action.endpointGuid),
          params: cleanParams
        }).pipe(
          mergeMap(histories => {
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            if (action.normalFormat) {
              this.transformData(entity.entityKey, mappedData, action.guid, histories);
            } else {
              this.transformEventData(entity.entityKey, mappedData, action.guid, histories);
            }
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType, histories.total_results, histories.total_pages)
            ];
          }),
          catchError(err => {
            return [
              new WrapperRequestActionFailed(createAutoscalerErrorMessage('fetch scaling history', err), action, actionType)
            ];
          }));
    })));

  
  fetchAppAutoscalerAppMetric$ = createEffect(() => this.actions$.pipe(
    ofType<GetAppAutoscalerMetricAction>(FETCH_APP_AUTOSCALER_METRIC),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const params = this.buildParams(action.initialParams, action.params);
      const entity = entityCatalog.getEntity(action);
      return this.http
        .get<PaginationResponse<AppAutoscalerMetricData>>(`${commonPrefix}/${action.url}`, {
          headers: this.addHeaders(action.endpointGuid),
          params
        }).pipe(
          mergeMap(response => {
            const data = response;
            const mappedData: NormalizedResponse<APIResource<AppAutoscalerMetricDataLocal>> = {
              entities: { [entity.entityKey]: {} },
              result: []
            };
            this.addMetric(
              entity.entityKey, mappedData, action.guid, action.metricName, data, parseInt(action.initialParams['start-time'], 10),
              parseInt(action.initialParams['end-time'], 10), action.skipFormat, action.trigger);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            return [
              new WrapperRequestActionFailed(createAutoscalerErrorMessage('fetch metrics', err), action, actionType)
            ];
          }));
    })));

  private createUpdatePolicy(
    action: CreateAppAutoscalerPolicyAction | UpdateAppAutoscalerPolicyAction,
    actionType: ApiRequestTypes = 'create'
  ): Observable<Action> {
    this.store.dispatch(new StartRequestAction(action, actionType));
    const entity = entityCatalog.getEntity(action);
    return this.http
      .put<AppAutoscalerPolicy>(
        `${commonPrefix}/apps/${action.guid}/policy`,
        autoscalerTransformMapToArray(action.policy),
        {
          headers: this.addHeaders(action.endpointGuid),
        }).pipe(
          mergeMap(response => {
            const policyInfo = autoscalerTransformArrayToMap(response);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, policyInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => {
            return [
              new WrapperRequestActionFailed(createAutoscalerErrorMessage('create policy', err), action, actionType)
            ];
          }));
  }

  private fetchPolicy(
    getPolicyAction: GetAppAutoscalerPolicyAction,
    getPolicyTriggerAction?: GetAppAutoscalerPolicyTriggerAction): Observable<Action> {
    const actionType = 'fetch';
    this.store.dispatch(new StartRequestAction(getPolicyAction, actionType));
    return this.http
      .get<AppAutoscalerPolicy>(`${commonPrefix}/apps/${getPolicyAction.guid}/policy`, {
        headers: this.addHeaders(getPolicyAction.endpointGuid)
      }).pipe(
        mergeMap(response => {
          const actionEntity = entityCatalog.getEntity(getPolicyAction);
          const policyInfo = autoscalerTransformArrayToMap(response);
          const mappedData = {
            entities: { [actionEntity.entityKey]: {} },
            result: []
          } as NormalizedResponse;
          this.transformData(actionEntity.entityKey, mappedData, getPolicyAction.guid, policyInfo);

          const res = [
            new WrapperRequestActionSuccess(mappedData, getPolicyAction, actionType)
          ];

          if (getPolicyTriggerAction) {
            const triggerEntity = entityCatalog.getEntity(getPolicyTriggerAction);
            const mappedPolicyData = {
              entities: { [triggerEntity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformTriggerData(
              triggerEntity.entityKey,
              mappedPolicyData,
              policyInfo,
              getPolicyTriggerAction.query,
              getPolicyAction.guid
            );
            res.push(
              new WrapperRequestActionSuccess(
                mappedPolicyData,
                getPolicyTriggerAction,
                actionType,
                Object.keys(policyInfo.scaling_rules_map).length,
                1)
            );
          }
          return res;
        }),
        catchError(err => {
          const noPolicy = err.status === 404;
          if (noPolicy) {
            err._body = 'No policy is defined for this application.';
          }
          const response: AppAutoscalerFetchPolicyFailedResponse = { status: err.status, noPolicy };

          return [
            new WrapperRequestActionFailed(createAutoscalerErrorMessage('fetch policy', err), getPolicyAction, actionType, null, response)
          ];
        }));
  }

  addMetric(
    schemaKey: string,
    mappedData: NormalizedResponse<APIResource<AppAutoscalerMetricDataLocal>>,
    appId: string,
    metricName: string,
    data: PaginationResponse<AppAutoscalerMetricData>,
    startTime: number,
    endTime: number,
    skipFormat: boolean,
    trigger: AppScalingTrigger
  ) {
    const id = AutoscalerConstants.createMetricId(appId, metricName);

    mappedData.entities[schemaKey][id] = {
      entity: buildMetricData(metricName, data, startTime, endTime, skipFormat, trigger),
      metadata: {
        guid: id,
        created_at: null,
        updated_at: null,
        url: null
      }
    };
    mappedData.result.push(id);
  }

  transformData(key: string, mappedData: NormalizedResponse, guid: string, data: unknown) {
    mappedData.entities[key][guid] = {
      entity: data,
      metadata: {
        guid
      }
    };
    mappedData.result.push(guid);
  }

  transformEventData(key: string, mappedData: NormalizedResponse, appGuid: string, data: PaginationResponse<AppAutoscalerEvent>) {
    mappedData.entities[key] = {};
    data.resources.forEach((item) => {
      const id = AutoscalerConstants.createMetricId(appGuid, `${item.timestamp}`);
      mappedData.entities[key][id] = {
        entity: item,
        metadata: {
          created_at: item.timestamp,
          guid: id,
          updated_at: item.timestamp
        }
      };
    });
    mappedData.result = Object.keys(mappedData.entities[key]);
  }

  transformTriggerData(
    key: string, mappedData: NormalizedResponse, data: AppAutoscalerPolicyLocal, query: AutoscalerQuery, appGuid: string) {
    mappedData.entities[key] = Object.keys(data.scaling_rules_map).reduce((entity: Record<string, unknown>, metricType: string) => {
      const id = AutoscalerConstants.createMetricId(appGuid, metricType);
      data.scaling_rules_map[metricType].query = query;
      entity[id] = {
        entity: data.scaling_rules_map[metricType],
        metadata: {
          guid: id
        }
      };
      return entity;
    }, {} as Record<string, unknown>);
    mappedData.result = Object.keys(mappedData.entities[key]);
  }

  addHeaders(cfGuid: string) {
    return {
      'x-cap-api-host': 'autoscaler',
      'x-cap-passthrough': 'true',
      'x-cap-cnsi-list': cfGuid
    };
  }

  buildParams(initialParams: AutoscalerPaginationParams, params: PaginationParam = {}, paginationParams?: AutoscalerPaginationParams) {
    const stringifiedParams = this.stringifyPagParams(params);
    const stringifiedPagParams = this.stringifyPagParams(paginationParams);
    const stringifiedInitialParams = this.stringifyPagParams(initialParams);

    const {
      "order-direction": order = null,
      ...cleanParams
    } = {
      ...stringifiedInitialParams,
      ...stringifiedParams,
      ...(stringifiedPagParams || {}),
    } as { [key: string]: string | string[] };
    if (order) {
      cleanParams.order = order;
    }
    return cleanParams;
  }

  stringifyPagParams(params: PaginationParam) {
    if (!params) {
      return {};
    }
    return Object.keys(params).reduce((pagParams, key) => {
      if (Object.hasOwn(params, key)) {
        const value = params[key];
        if (Array.isArray(value)) {
          pagParams[key] = value;
        } else {
          pagParams[key] = String(value);
        }
      }
      return pagParams;
    }, {} as { [key: string]: string | string[] });
  }

  getPaginationParams(paginationState: PaginationEntityState): PaginationParam {
    return paginationState
      ? {
        ...paginationState.params,
        page: paginationState.currentPage.toString(),
      }
      : {};
  }

}
