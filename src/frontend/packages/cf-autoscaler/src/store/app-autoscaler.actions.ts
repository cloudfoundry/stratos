import { RequestOptions } from '@angular/http';

import { applicationSchemaKey, entityFactory } from '../../../store/src/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../store/src/helpers/entity-relations/entity-relations.types';
import { ApiRequestTypes } from '../../../store/src/reducers/api-request-reducer/request-helpers';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { IRequestAction } from '../../../store/src/types/request.types';
import { AppAutoscalerPolicyLocal, AppScalingTrigger } from './app-autoscaler.types';
import {
  appAutoscalerAppMetricSchemaKey,
  appAutoscalerHealthSchemaKey,
  appAutoscalerInfoSchemaKey,
  appAutoscalerPolicySchemaKey,
  appAutoscalerPolicyTriggerSchemaKey,
  appAutoscalerScalingHistorySchemaKey,
} from './autoscaler.store.module';

export const AppAutoscalerPolicyEvents = {
  GET_APP_AUTOSCALER_POLICY: '[App Autoscaler] Get autoscaler policy',
  GET_APP_AUTOSCALER_POLICY_SUCCESS: '[App Autoscaler] Get autoscaler policy success',
  GET_APP_AUTOSCALER_POLICY_FAILED: '[App Autoscaler] Get autoscaler policy failed'
};

export const AppAutoscalerPolicyTriggerEvents = {
  GET_APP_AUTOSCALER_POLICY: '[App Autoscaler] Get autoscaler policy trigger',
  GET_APP_AUTOSCALER_POLICY_SUCCESS: '[App Autoscaler] Get autoscaler policy trigger success',
  GET_APP_AUTOSCALER_POLICY_FAILED: '[App Autoscaler] Get autoscaler policy trigger failed'
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

export const APP_AUTOSCALER_POLICY = '[New App Autoscaler] Fetch policy';
export const APP_AUTOSCALER_POLICY_TRIGGER = '[New App Autoscaler] Fetch policy trigger';
export const UPDATE_APP_AUTOSCALER_POLICY = '[New App Autoscaler] Update policy';
export const DETACH_APP_AUTOSCALER_POLICY = '[New App Autoscaler] Detach policy';
export const APP_AUTOSCALER_HEALTH = '[New App Autoscaler] Fetch Health';
export const APP_AUTOSCALER_SCALING_HISTORY = '[New App Autoscaler] Fetch Scaling History';
export const FETCH_APP_AUTOSCALER_METRIC = '[New App Autoscaler] Fetch Metric';
export const AUTOSCALER_INFO = '[Autoscaler] Fetch Info';

export const UPDATE_APP_AUTOSCALER_POLICY_STEP = '[Edit Autoscaler Policy] Step';

export class GetAppAutoscalerInfoAction implements IRequestAction {
  public guid: string;
  constructor(
    public endpointGuid: string,
  ) {
    this.guid = endpointGuid;
  }
  type = AUTOSCALER_INFO;
  entity = entityFactory(appAutoscalerInfoSchemaKey);
  entityKey = appAutoscalerInfoSchemaKey;
}

export class GetAppAutoscalerHealthAction implements IRequestAction {
  public guid: string;
  constructor(
    public endpointGuid: string,
  ) {
    this.guid = endpointGuid;
  }
  type = APP_AUTOSCALER_HEALTH;
  entity = entityFactory(appAutoscalerHealthSchemaKey);
  entityKey = appAutoscalerHealthSchemaKey;
}

export class GetAppAutoscalerPolicyAction implements IRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) { }
  type = APP_AUTOSCALER_POLICY;
  entity = entityFactory(appAutoscalerPolicySchemaKey);
  entityKey = appAutoscalerPolicySchemaKey;
}

export class UpdateAppAutoscalerPolicyAction implements IRequestAction {
  static updateKey = 'Updating-Existing-Application-Policy';
  constructor(
    public guid: string,
    public endpointGuid: string,
    public policy: AppAutoscalerPolicyLocal,
  ) { }
  type = UPDATE_APP_AUTOSCALER_POLICY;
  entityKey = appAutoscalerPolicySchemaKey;
}

export class DetachAppAutoscalerPolicyAction implements IRequestAction {
  static updateKey = 'Detaching-Existing-Application-Policy';
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) { }
  type = DETACH_APP_AUTOSCALER_POLICY;
  entityKey = appAutoscalerPolicySchemaKey;
  requestType: ApiRequestTypes = 'delete';
}

export class GetAppAutoscalerPolicyTriggerAction implements PaginatedAction {
  constructor(
    public paginationKey: string,
    public guid: string,
    public endpointGuid: string,
    public normalFormat?: boolean
  ) {
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(applicationSchemaKey, guid);
  }
  actions = [
    AppAutoscalerPolicyTriggerEvents.GET_APP_AUTOSCALER_POLICY,
    AppAutoscalerPolicyTriggerEvents.GET_APP_AUTOSCALER_POLICY_SUCCESS,
    AppAutoscalerPolicyTriggerEvents.GET_APP_AUTOSCALER_POLICY_FAILED
  ];
  type = APP_AUTOSCALER_POLICY_TRIGGER;
  entity = [entityFactory(appAutoscalerPolicyTriggerSchemaKey)];
  entityKey = appAutoscalerPolicyTriggerSchemaKey;
  options: RequestOptions;
  query: AutoscalerQuery = {
    metric: 'policy'
  };
  windowValue: string;
}

export interface AutoscalerPaginationParams {
  'order-direction-field'?: string;
  'order-direction': 'asc' | 'desc';
  'results-per-page': string;
  'start-time': string;
  'end-time': string;
  'page'?: string;
}

export interface AutoscalerQuery {
  metric: string;
  params?: {
    start: number;
    end: number
  };
}

export class GetAppAutoscalerScalingHistoryAction implements PaginatedAction {
  private static sortField = 'timestamp';
  constructor(
    public paginationKey: string,
    public guid: string,
    public endpointGuid: string,
    public normalFormat?: boolean,
    public params?: AutoscalerPaginationParams,
  ) {
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(applicationSchemaKey, guid);
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
  initialParams: AutoscalerPaginationParams = {
    'order-direction-field': GetAppAutoscalerScalingHistoryAction.sortField,
    'order-direction': 'desc',
    'results-per-page': '5',
    'start-time': '0',
    'end-time': '0',
  };
  query: AutoscalerQuery = {
    metric: 'history'
  };
  windowValue: string;
}

export abstract class GetAppAutoscalerMetricAction implements PaginatedAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public metricName: string,
    public skipFormat: boolean,
    public trigger: AppScalingTrigger,
    public params: AutoscalerPaginationParams,
  ) {
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(applicationSchemaKey, guid, metricName);
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
    public guid: string,
    public endpointGuid: string,
    public metricName: string,
    public skipFormat: boolean,
    public trigger: AppScalingTrigger,
    public params: AutoscalerPaginationParams,
  ) {
    super(guid, endpointGuid, metricName, skipFormat, trigger, params);
    this.url = `apps/${guid}/metric/${metricName}`;
  }
  entityKey = appAutoscalerAppMetricSchemaKey;
}
