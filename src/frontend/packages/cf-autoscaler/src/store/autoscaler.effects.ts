import { Injectable } from '@angular/core';
import { Headers, Http, Request, RequestOptions, URLSearchParams } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { catchError, mergeMap, withLatestFrom } from 'rxjs/operators';

import { PaginationResponse } from '../../../cloud-foundry/src/store/types/cf-api.types';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { environment } from '../../../core/src/environments/environment';
import { AppState } from '../../../store/src/app-state';
import {
  resultPerPageParam,
  resultPerPageParamDefault,
} from '../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { selectPaginationState } from '../../../store/src/selectors/pagination.selectors';
import { APIResource, NormalizedResponse } from '../../../store/src/types/api.types';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../../../store/src/types/pagination.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../store/src/types/request.types';
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
  AutoscalerPaginationParams,
  AutoscalerQuery,
  DETACH_APP_AUTOSCALER_POLICY,
  DetachAppAutoscalerPolicyAction,
  FETCH_APP_AUTOSCALER_METRIC,
  GetAppAutoscalerHealthAction,
  GetAppAutoscalerMetricAction,
  GetAppAutoscalerPolicyAction,
  GetAppAutoscalerPolicyTriggerAction,
  GetAppAutoscalerScalingHistoryAction,
  UPDATE_APP_AUTOSCALER_POLICY,
  UpdateAppAutoscalerPolicyAction,
} from './app-autoscaler.actions';
import {
  AppAutoscalerEvent,
  AppAutoscalerFetchPolicyFailedResponse,
  AppAutoscalerMetricData,
  AppAutoscalerMetricDataLocal,
  AppAutoscalerPolicyLocal,
  AppScalingTrigger,
} from './app-autoscaler.types';

const { proxyAPIVersion } = environment;
const commonPrefix = `/pp/${proxyAPIVersion}/autoscaler`;

function createAutoscalerRequestMessage(requestType: string, error: { status: string, _body: string }) {
  return `Unable to ${requestType}: ${error.status} ${error._body}`;
}

@Injectable()
export class AutoscalerEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect()
  fetchAppAutoscalerHealth$ = this.actions$.pipe(
    ofType<GetAppAutoscalerHealthAction>(APP_AUTOSCALER_HEALTH),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const options = new RequestOptions();
      options.url = `${commonPrefix}/health`;
      options.method = 'get';
      options.headers = this.addHeaders(action.endpointGuid);
      return this.http
        .request(new Request(options)).pipe(
          mergeMap(response => {
            const entity = entityCatalogue.getEntity(action);
            const healthInfo = response.json();
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, healthInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(createAutoscalerRequestMessage('fetch health info', err), action, actionType)
          ]));
    }));

  @Effect()
  updateAppAutoscalerPolicy$ = this.actions$.pipe(
    ofType<UpdateAppAutoscalerPolicyAction>(UPDATE_APP_AUTOSCALER_POLICY),
    mergeMap(action => {
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const options = new RequestOptions();
      options.url = `${commonPrefix}/apps/${action.guid}/policy`;
      options.method = 'put';
      options.headers = this.addHeaders(action.endpointGuid);
      options.body = autoscalerTransformMapToArray(action.policy);
      return this.http
        .request(new Request(options)).pipe(
          mergeMap(response => {
            const policyInfo = autoscalerTransformArrayToMap(response.json());
            const entity = entityCatalogue.getEntity(action);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, policyInfo);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(createAutoscalerRequestMessage('update policy', err), action, actionType)
          ]));
    }));

  @Effect()
  getAppAutoscalerPolicy$ = this.actions$.pipe(
    ofType<GetAppAutoscalerPolicyAction>(APP_AUTOSCALER_POLICY),
    mergeMap(action => this.fetchPolicy(action))
  );

  @Effect()
  detachAppAutoscalerPolicy$ = this.actions$.pipe(
    ofType<DetachAppAutoscalerPolicyAction>(DETACH_APP_AUTOSCALER_POLICY),
    mergeMap(action => {
      const actionType = 'delete';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const options = new RequestOptions();
      options.url = `${commonPrefix}/apps/${action.guid}/policy`;
      options.method = 'delete';
      options.headers = this.addHeaders(action.endpointGuid);
      return this.http
        .request(new Request(options)).pipe(
          mergeMap(response => {
            const entity = entityCatalogue.getEntity(action);
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.transformData(entity.entityKey, mappedData, action.guid, { enabled: false });
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(createAutoscalerRequestMessage('detach policy', err), action, actionType)
          ]));
    }));

  @Effect()
  fetchAppAutoscalerPolicyTrigger$ = this.actions$.pipe(
    ofType<GetAppAutoscalerPolicyTriggerAction>(APP_AUTOSCALER_POLICY_TRIGGER),
    mergeMap(action => this.fetchPolicy(new GetAppAutoscalerPolicyAction(action.guid, action.endpointGuid), action))
  );

  @Effect()
  fetchAppAutoscalerScalingHistory$ = this.actions$.pipe(
    ofType<GetAppAutoscalerScalingHistoryAction>(APP_AUTOSCALER_SCALING_HISTORY),
    withLatestFrom(this.store),
    mergeMap(([action, state]) => {
      const actionType = 'fetch';
      const paginatedAction = action as PaginatedAction;
      this.store.dispatch(new StartRequestAction(action, actionType));
      const options = new RequestOptions();
      options.url = `${commonPrefix}/apps/${action.guid}/event`;
      options.method = 'get';
      options.headers = this.addHeaders(action.endpointGuid);
      const entity = entityCatalogue.getEntity(action);
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
      options.params = this.buildParams(action.initialParams, trimmedPaginationParams, action.params);
      if (!options.params.has(resultPerPageParam)) {
        options.params.set(
          resultPerPageParam,
          resultPerPageParamDefault.toString(),
        );
      }
      if (options.params.has('order-direction-field')) {
        options.params.delete('order-direction-field');
      }
      if (options.params.has('order-direction')) {
        options.params.set('order', options.params.get('order-direction'));
        options.params.delete('order-direction');
      }
      // TODO this needs to be changed into a string key-value
      // if (metricConfig && metricConfig.params) {
      //   options.params.set('start-time', metricConfig.params.start + '000000000');
      //   options.params.set('end-time', metricConfig.params.end + '000000000');
      // } else if (action.query && action.query.params) {
      //   options.params.set('start-time', action.query.params.start + '000000000');
      //   options.params.set('end-time', action.query.params.end + '000000000');
      // }
      return this.http
        .request(new Request(options)).pipe(
          mergeMap(response => {
            const histories = response.json();
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
          catchError(err => [
            new WrapperRequestActionFailed(createAutoscalerRequestMessage('fetch scaling history', err), action, actionType)
          ]));
    }));

  @Effect()
  fetchAppAutoscalerAppMetric$ = this.actions$.pipe(
    ofType<GetAppAutoscalerMetricAction>(FETCH_APP_AUTOSCALER_METRIC),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      const options = new RequestOptions();
      options.url = `${commonPrefix}/${action.url}`;
      options.method = 'get';
      options.headers = this.addHeaders(action.endpointGuid);
      options.params = this.buildParams(action.initialParams, action.params);
      if (options.params.has('order-direction')) {
        options.params.set('order', options.params.get('order-direction'));
        options.params.delete('order-direction');
      }
      const entity = entityCatalogue.getEntity(action);
      return this.http
        .request(new Request(options)).pipe(
          mergeMap(response => {
            const data: PaginationResponse<AppAutoscalerMetricData> = response.json();
            const mappedData = {
              entities: { [entity.entityKey]: {} },
              result: []
            } as NormalizedResponse;
            this.addMetric(
              entity.entityKey, mappedData, action.guid, action.metricName, data, parseInt(action.initialParams['start-time'], 10),
              parseInt(action.initialParams['end-time'], 10), action.skipFormat, action.trigger);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(createAutoscalerRequestMessage('fetch metrics', err), action, actionType)
          ]));
    }));

  private fetchPolicy(
    getPolicyAction: GetAppAutoscalerPolicyAction,
    getPolicyTriggerAction?: GetAppAutoscalerPolicyTriggerAction): Observable<Action> {
    const actionType = 'fetch';
    this.store.dispatch(new StartRequestAction(getPolicyAction, actionType));
    const options = new RequestOptions();
    options.url = `${commonPrefix}/apps/${getPolicyAction.guid}/policy`;
    options.method = 'get';
    options.headers = this.addHeaders(getPolicyAction.endpointGuid);
    return this.http
      .request(new Request(options)).pipe(
        mergeMap(response => {
          const actionEntity = entityCatalogue.getEntity(getPolicyAction);
          const policyInfo = autoscalerTransformArrayToMap(response.json());
          const mappedData = {
            entities: { [actionEntity.entityKey]: {} },
            result: []
          } as NormalizedResponse;
          this.transformData(actionEntity.entityKey, mappedData, getPolicyAction.guid, policyInfo);

          const res = [
            new WrapperRequestActionSuccess(mappedData, getPolicyAction, actionType)
          ];

          if (getPolicyTriggerAction) {
            const triggerEntity = entityCatalogue.getEntity(getPolicyTriggerAction);
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
          const noPolicy = err.status === 404 && err._body === '{}';
          if (noPolicy) {
            err._body = 'No policy is defined for this application.';
          }
          const response: AppAutoscalerFetchPolicyFailedResponse = { status: err.status, noPolicy };

          return [
            new WrapperRequestActionFailed(createAutoscalerRequestMessage('fetch policy', err), getPolicyAction, actionType, null, response)
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

  transformData(key: string, mappedData: NormalizedResponse, appGuid: string, data: any) {
    mappedData.entities[key][appGuid] = {
      entity: data,
      metadata: {
        guid: appGuid
      }
    };
    mappedData.result.push(appGuid);
  }

  transformEventData(key: string, mappedData: NormalizedResponse, appGuid: string, data: PaginationResponse<AppAutoscalerEvent>) {
    mappedData.entities[key] = [];
    data.resources.forEach((item) => {
      const id = AutoscalerConstants.createMetricId(appGuid, item.timestamp + '');
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
    mappedData.entities[key] = Object.keys(data.scaling_rules_map).reduce((entity, metricType) => {
      const id = AutoscalerConstants.createMetricId(appGuid, metricType);
      data.scaling_rules_map[metricType].query = query;
      entity[id] = {
        entity: data.scaling_rules_map[metricType],
        metadata: {
          guid: id
        }
      };
      return entity;
    }, []);
    mappedData.result = Object.keys(mappedData.entities[key]);
  }

  addHeaders(cfGuid: string) {
    const headers = new Headers();
    headers.set('x-cap-api-host', 'autoscaler');
    headers.set('x-cap-passthrough', 'true');
    headers.set('x-cap-cnsi-list', cfGuid);
    return headers;
  }

  buildParams(initialParams: AutoscalerPaginationParams, params?: PaginationParam, paginationParams?: AutoscalerPaginationParams) {
    const searchParams = new URLSearchParams();
    if (initialParams) {
      Object.keys(initialParams).forEach((key) => {
        searchParams.set(key, initialParams[key].toString());
      });
    }
    if (params) {
      Object.keys(params).forEach((key) => {
        searchParams.set(key, params[key].toString());
      });
    }
    if (paginationParams) {
      Object.keys(paginationParams).forEach((key) => {
        searchParams.set(key, paginationParams[key].toString());
      });
    }
    return searchParams;
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
