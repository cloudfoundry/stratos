import { RequestOptions } from '@angular/http';

import {
  appAutoscalerAppMetricSchemaKey,
  appAutoscalerHealthSchemaKey,
  appAutoscalerInsMetricSchemaKey,
  appAutoscalerPolicySchemaKey,
  appAutoscalerScalingHistorySchemaKey,
  appAutoscalerUpdatedPolicySchemaKey,
  entityFactory,
} from '../helpers/entity-factory';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction } from '../types/request.types';

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

export const AppAutoscalerMetricEvents = {
  GET_APP_AUTOSCALER_METRIC: '[App Autoscaler] Get autoscaler metric',
  GET_APP_AUTOSCALER_METRIC_SUCCESS: '[App Autoscaler] Get autoscaler metric success',
  GET_APP_AUTOSCALER_METRIC_FAILED: '[App Autoscaler] Get autoscaler metric failed'
};

export const AppAutoscalerHealthEvents = {
  GET_APP_AUTOSCALER_HEALTH: '[App Autoscaler] Get autoscaler health',
  GET_APP_AUTOSCALER_HEALTH_SUCCESS: '[App Autoscaler] Get autoscaler health success',
  GET_APP_AUTOSCALER_HEALTH_FAILED: '[App Autoscaler] Get autoscaler health failed'
};

export const APP_AUTOSCALER_POLICY = '[New App Autoscaler] Fetch policy';
export const UPDATE_APP_AUTOSCALER_POLICY = '[New App Autoscaler] Update policy';
export const DETACH_APP_AUTOSCALER_POLICY = '[New App Autoscaler] Detach policy';
export const APP_AUTOSCALER_HEALTH = '[New App Autoscaler] Fetch Health';
export const APP_AUTOSCALER_SCALING_HISTORY = '[New App Autoscaler] Fetch Scaling History';
export const FETCH_APP_AUTOSCALER_METRIC = '[New App Autoscaler] Fetch Metric';

export class GetAppAutoscalerHealthAction implements IRequestAction {
  constructor(
    public appGuid: string,
    public cfGuid: string,
  ) { }
  type = APP_AUTOSCALER_HEALTH;
  entityKey = appAutoscalerHealthSchemaKey;
}

export class GetAppAutoscalerPolicyAction implements IRequestAction {
  constructor(
    public appGuid: string,
    public cfGuid: string,
  ) { }
  type = APP_AUTOSCALER_POLICY;
  entityKey = appAutoscalerPolicySchemaKey;
}

export class UpdateAppAutoscalerPolicyAction implements IRequestAction {
  static updateKey = 'Updating-Existing-Application-Policy';
  constructor(
    public appGuid: string,
    public cfGuid: string,
    public policy: any,
  ) { }
  type = UPDATE_APP_AUTOSCALER_POLICY;
  entityKey = appAutoscalerUpdatedPolicySchemaKey;
}

export class DetachAppAutoscalerPolicyAction implements IRequestAction {
  static updateKey = 'Detaching-Existing-Application-Policy';
  constructor(
    public appGuid: string,
    public cfGuid: string,
  ) { }
  type = DETACH_APP_AUTOSCALER_POLICY;
  entityKey = appAutoscalerPolicySchemaKey;
}

export class GetAppAutoscalerPolicyTriggerAction implements PaginatedAction {
  constructor(
    public paginationKey: string,
    public appGuid: string,
    public cfGuid: string,
    public normalFormat?,
  ) {
    this.query = {
      metric: 'policy'
    };
  }
  actions = [
    AppAutoscalerPolicyEvents.GET_APP_AUTOSCALER_POLICY,
    AppAutoscalerPolicyEvents.GET_APP_AUTOSCALER_POLICY_SUCCESS,
    AppAutoscalerPolicyEvents.GET_APP_AUTOSCALER_POLICY_FAILED
  ];
  type = APP_AUTOSCALER_POLICY;
  entity = [entityFactory(appAutoscalerPolicySchemaKey)];
  entityKey = appAutoscalerPolicySchemaKey;
  options: RequestOptions;
  query: any;
  windowValue: string;
}

export class GetAppAutoscalerScalingHistoryAction implements PaginatedAction {
  private static sortField = 'timestamp';
  constructor(
    public paginationKey: string,
    public appGuid: string,
    public cfGuid: string,
    public normalFormat?,
    public params?,
  ) {
    this.query = {
      metric: 'history'
    };
  }
  actions = [
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY,
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY_SUCCESS,
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY_FAILED
  ];
  type = APP_AUTOSCALER_SCALING_HISTORY;
  entity = [entityFactory(appAutoscalerScalingHistorySchemaKey)];
  entityKey = appAutoscalerScalingHistorySchemaKey;
  options: RequestOptions;
  initialParams = {
    'order-direction-field': GetAppAutoscalerScalingHistoryAction.sortField,
    'order-direction': 'desc',
    'start-time': 0,
    'end-time': (new Date()).getTime().toString() + '000000',
  };
  query: any;
  windowValue: string;
}

export abstract class GetAppAutoscalerMetricAction implements PaginatedAction {
  constructor(
    public appGuid: string,
    public cfGuid: string,
    public metricName: string,
    public skipFormat: boolean,
    public trigger,
    public params
  ) {
    this.paginationKey = appGuid + '-' + metricName;
  }
  actions = [
    AppAutoscalerMetricEvents.GET_APP_AUTOSCALER_METRIC,
    AppAutoscalerMetricEvents.GET_APP_AUTOSCALER_METRIC_SUCCESS,
    AppAutoscalerMetricEvents.GET_APP_AUTOSCALER_METRIC_FAILED
  ];
  url: string;
  type = FETCH_APP_AUTOSCALER_METRIC;
  entityKey: string;
  paginationKey: string;
  initialParams = this.params;
}

export class GetAppAutoscalerAppMetricAction extends GetAppAutoscalerMetricAction implements PaginatedAction {
  constructor(
    public appGuid: string,
    public cfGuid: string,
    public metricName: string,
    public skipFormat: boolean,
    public trigger,
    public params
  ) {
    super(appGuid, cfGuid, metricName, skipFormat, trigger, params);
    this.url = `apps/${appGuid}/metric/${metricName}`;
  }
  entityKey = appAutoscalerAppMetricSchemaKey;
}

export class GetAppAutoscalerInsMetricAction extends GetAppAutoscalerMetricAction implements PaginatedAction {
  constructor(
    public appGuid: string,
    public cfGuid: string,
    public metricName: string,
    public skipFormat: boolean,
    public trigger,
    public params
  ) {
    super(appGuid, cfGuid, metricName, skipFormat, trigger, params);
    this.url = `apps/${appGuid}/metric_histories/${metricName}`;
  }
  entityKey = appAutoscalerInsMetricSchemaKey;
}
