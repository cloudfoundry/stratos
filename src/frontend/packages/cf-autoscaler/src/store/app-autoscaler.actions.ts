import { HttpRequest } from '@angular/common/http';

import { applicationEntityType } from '../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { ApiRequestTypes } from '../../../store/src/reducers/api-request-reducer/request-helpers';
import { PaginatedAction, PaginationParam } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { AppAutoscalerCredential, AppAutoscalerPolicyLocal, AppScalingTrigger } from './app-autoscaler.types';
import {
  appAutoscalerAppMetricEntityType,
  appAutoscalerCredentialEntityType,
  appAutoscalerHealthEntityType,
  appAutoscalerInfoEntityType,
  appAutoscalerPolicyEntityType,
  appAutoscalerPolicyTriggerEntityType,
  appAutoscalerScalingHistoryEntityType,
  AUTOSCALER_ENDPOINT_TYPE,
  autoscalerEntityFactory,
} from './autoscaler-entity-factory';

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
export const CREATE_APP_AUTOSCALER_POLICY = '[New App Autoscaler] Create policy';
export const UPDATE_APP_AUTOSCALER_POLICY = '[New App Autoscaler] Update policy';
export const DETACH_APP_AUTOSCALER_POLICY = '[New App Autoscaler] Detach policy';
export const UPDATE_APP_AUTOSCALER_CREDENTIAL = '[New App Autoscaler] Update credential';
export const DELETE_APP_AUTOSCALER_CREDENTIAL = '[New App Autoscaler] Delete credential';
export const APP_AUTOSCALER_HEALTH = '[New App Autoscaler] Fetch Health';
export const APP_AUTOSCALER_SCALING_HISTORY = '[New App Autoscaler] Fetch Scaling History';
export const FETCH_APP_AUTOSCALER_METRIC = '[New App Autoscaler] Fetch Metric';
export const AUTOSCALER_INFO = '[Autoscaler] Fetch Info';

export const UPDATE_APP_AUTOSCALER_POLICY_STEP = '[Edit Autoscaler Policy] Step';

export class GetAppAutoscalerInfoAction implements EntityRequestAction {
  public guid: string;
  constructor(
    public endpointGuid: string,
  ) {
    this.guid = endpointGuid;
  }
  type = AUTOSCALER_INFO;
  entity = autoscalerEntityFactory(appAutoscalerInfoEntityType);
  entityType = appAutoscalerInfoEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
}

export class GetAppAutoscalerHealthAction implements EntityRequestAction {
  public guid: string;
  constructor(
    public endpointGuid: string,
  ) {
    this.guid = endpointGuid;
  }
  type = APP_AUTOSCALER_HEALTH;
  entity = autoscalerEntityFactory(appAutoscalerHealthEntityType);
  entityType = appAutoscalerHealthEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
}

export class GetAppAutoscalerPolicyAction implements EntityRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) { }
  type = APP_AUTOSCALER_POLICY;
  entity = autoscalerEntityFactory(appAutoscalerPolicyEntityType);
  entityType = appAutoscalerPolicyEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
}

export class CreateAppAutoscalerPolicyAction implements EntityRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public policy: AppAutoscalerPolicyLocal,
  ) { }
  type = CREATE_APP_AUTOSCALER_POLICY;
  entityType = appAutoscalerPolicyEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
}

export class UpdateAppAutoscalerPolicyAction extends CreateAppAutoscalerPolicyAction {
  static updateKey = 'Updating-Existing-Application-Policy';
  type = UPDATE_APP_AUTOSCALER_POLICY;
  updatingKey = UpdateAppAutoscalerPolicyAction.updateKey;
  entityType = appAutoscalerPolicyEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
}

export class DetachAppAutoscalerPolicyAction implements EntityRequestAction {
  static updateKey = 'Detaching-Existing-Application-Policy';
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) { }
  type = DETACH_APP_AUTOSCALER_POLICY;
  entityType = appAutoscalerPolicyEntityType;
  requestType: ApiRequestTypes = 'delete';
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
}

export class GetAppAutoscalerPolicyTriggerAction implements PaginatedAction {
  constructor(
    public paginationKey: string,
    public guid: string,
    public endpointGuid: string,
    public normalFormat?: boolean
  ) {
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(applicationEntityType, guid);
  }
  actions = [
    AppAutoscalerPolicyTriggerEvents.GET_APP_AUTOSCALER_POLICY,
    AppAutoscalerPolicyTriggerEvents.GET_APP_AUTOSCALER_POLICY_SUCCESS,
    AppAutoscalerPolicyTriggerEvents.GET_APP_AUTOSCALER_POLICY_FAILED
  ];
  type = APP_AUTOSCALER_POLICY_TRIGGER;
  entity = [autoscalerEntityFactory(appAutoscalerPolicyTriggerEntityType)];
  entityType = appAutoscalerPolicyTriggerEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
  options: HttpRequest<any>;
  query: AutoscalerQuery = {
    metric: 'policy'
  };
  windowValue: string;
}

export interface AutoscalerPaginationParams extends PaginationParam {
  'order-direction-field'?: string;
  'order-direction': 'asc' | 'desc';
  'results-per-page': string;
  'start-time': string;
  'end-time': string;
  'page'?: string;
  'order'?: string;
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
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(applicationEntityType, guid);
  }
  actions = [
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY,
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY_SUCCESS,
    AppAutoscalerScalingHistoryEvents.GET_APP_AUTOSCALER_SCALING_HISTORY_FAILED
  ];
  type = APP_AUTOSCALER_SCALING_HISTORY;
  entity = [autoscalerEntityFactory(appAutoscalerScalingHistoryEntityType)];
  entityType = appAutoscalerScalingHistoryEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
  options: HttpRequest<any>;
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
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(applicationEntityType, guid, metricName);
  }
  actions = [
    AppAutoscalerMetricEvents.GET_APP_AUTOSCALER_METRIC,
    AppAutoscalerMetricEvents.GET_APP_AUTOSCALER_METRIC_SUCCESS,
    AppAutoscalerMetricEvents.GET_APP_AUTOSCALER_METRIC_FAILED
  ];
  url: string;
  type = FETCH_APP_AUTOSCALER_METRIC;
  entityType: string;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
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
  entityType = appAutoscalerAppMetricEntityType;
}

export class UpdateAppAutoscalerCredentialAction implements EntityRequestAction {
  static updateKey = 'Updating-Application-Credential';
  constructor(
    public guid: string,
    public endpointGuid: string,
    public credential?: AppAutoscalerCredential,
  ) { }
  type = UPDATE_APP_AUTOSCALER_CREDENTIAL;
  entity = autoscalerEntityFactory(appAutoscalerCredentialEntityType);
  entityType = appAutoscalerCredentialEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
  updatingKey = UpdateAppAutoscalerCredentialAction.updateKey;
}

export class DeleteAppAutoscalerCredentialAction implements EntityRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) { }
  type = DELETE_APP_AUTOSCALER_CREDENTIAL;
  entity = autoscalerEntityFactory(appAutoscalerCredentialEntityType);
  entityType = appAutoscalerCredentialEntityType;
  endpointType = AUTOSCALER_ENDPOINT_TYPE;
  requestType: ApiRequestTypes = 'delete';
}
