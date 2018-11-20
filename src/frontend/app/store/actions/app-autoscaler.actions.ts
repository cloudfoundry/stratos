import { RequestOptions, Headers, URLSearchParams } from '@angular/http';

import {
  appAutoscalerHealthSchemaKey,
  appAutoscalerPolicySchemaKey,
  appAutoscalerScalingHistorySchemaKey,
  appAutoscalerAppMetricHistorySchemaKey,
  appAutoscalerInsMetricHistorySchemaKey,
  entityFactory,
} from '../helpers/entity-factory';
import { CFStartAction, ICFAction } from '../types/request.types';

const endpointApiHostHeader = 'x-cap-api-host'; 

export const AppAutoscalerPolicyEvents = {
  GET_APP_AUTOSCALER_POLICY: '[App Autoscaler] Get autoscaler policy',
  GET_APP_AUTOSCALER_POLICY_SUCCESS: '[App Autoscaler] Get autoscaler policy success',
  GET_APP_AUTOSCALER_POLICY_FAILED: '[App Autoscaler] Get autoscaler policy failed'
};

export const AppAutoscalerScalingHistoryEvents = {
  GET_APP_AUTOSCALER_SCALING_HISTORY: '[App Autoscaler] Get autoscaler scaling history',
  GET_APP_AUTOSCALER_SCALING_HISTORY_SUCCESS: '[App Autoscaler] Get autoscaler scaling history success',
  GET_APP_AUTOSCALER_SCALING_HISTORY_FAILED: '[App Autoscaler] Get autoscaler scaling history failed'
};

export const AppAutoscalerHealthEvents = {
  GET_APP_AUTOSCALER_HEALTH: '[App Autoscaler] Get autoscaler health',
  GET_APP_AUTOSCALER_HEALTH_SUCCESS: '[App Autoscaler] Get autoscaler health success',
  GET_APP_AUTOSCALER_HEALTH_FAILED: '[App Autoscaler] Get autoscaler health failed'
};

export class GetAppAutoscalerHealthAction extends CFStartAction implements ICFAction {
  options: RequestOptions;
  constructor(
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `public/health_check`
    this.options.method = 'get'
    this.options.headers = new Headers();
    this.options.headers.set(endpointApiHostHeader, 'scalingconsole');
  }
  entity = [entityFactory(appAutoscalerHealthSchemaKey)];
  entityKey = appAutoscalerHealthSchemaKey;
  paginationKey: string;
  actions = [
    AppAutoscalerHealthEvents.GET_APP_AUTOSCALER_HEALTH,
    AppAutoscalerHealthEvents.GET_APP_AUTOSCALER_HEALTH_SUCCESS,
    AppAutoscalerHealthEvents.GET_APP_AUTOSCALER_HEALTH_FAILED
  ];
}

export class GetAppAutoscalerPolicyAction extends CFStartAction implements ICFAction {
  options: RequestOptions;
  constructor(
    public guid: string,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `apps/${guid}/policy`
    this.options.method = 'get'
    this.options.headers = new Headers();
    this.options.headers.set(endpointApiHostHeader, 'autoscaler');
  }
  entity = [entityFactory(appAutoscalerPolicySchemaKey)];
  entityKey = appAutoscalerPolicySchemaKey;
  paginationKey: string;
  actions = [
    AppAutoscalerPolicyEvents.GET_APP_AUTOSCALER_POLICY,
    AppAutoscalerPolicyEvents.GET_APP_AUTOSCALER_POLICY_SUCCESS,
    AppAutoscalerPolicyEvents.GET_APP_AUTOSCALER_POLICY_FAILED
  ];
}

export class GetAppAutoscalerScalingHistoryAction extends CFStartAction implements ICFAction {
  options: RequestOptions;
  constructor(
    public guid: string,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `apps/${guid}/scaling_histories`
    this.options.method = 'get'
    this.options.headers = new Headers();
    this.options.headers.set(endpointApiHostHeader, 'autoscaler');
    this.options.params = new URLSearchParams();
    this.options.params.append('start-time', '1542124800000000000');
    this.options.params.append('end-time', '1542729600000000000');
    this.options.params.append('page', '1');
    this.options.params.append('results-per-page', '10');
    this.options.params.append('order', 'desc');
  }
  entity = [entityFactory(appAutoscalerScalingHistorySchemaKey)];
  entityKey = appAutoscalerScalingHistorySchemaKey;
  paginationKey: string;
  flattenPagination: false;
  actions = [
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY,
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY_SUCCESS,
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY_FAILED
  ];
}