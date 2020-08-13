import { Action } from '@ngrx/store';

import { EndpointType } from '../extension-types';
import { endpointEntityType, STRATOS_ENDPOINT_TYPE, stratosEntityFactory } from '../helpers/stratos-entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { endpointListKey, EndpointModel, INewlyConnectedEndpointInfo } from '../types/endpoint.types';
import { PaginatedAction } from '../types/pagination.types';
import { EntityRequestAction } from '../types/request.types';

export const GET_ENDPOINTS = '[Endpoints] Get all';
export const GET_ENDPOINTS_SUCCESS = '[Endpoints] Get all success';
export const GET_ENDPOINTS_FAILED = '[Endpoints] Get all failed';

export const GET_ENDPOINT = '[Endpoints] Get';
export const GET_ENDPOINT_SUCCESS = '[Endpoints] Get success';
export const GET_ENDPOINT_FAILED = '[Endpoints] Get failed';

export const CONNECT_ENDPOINTS = '[Endpoints] Connect';
export const CONNECT_ENDPOINTS_SUCCESS = '[Endpoints] Connect succeed';
export const CONNECT_ENDPOINTS_FAILED = '[Endpoints] Connect failed';

export const DISCONNECT_ENDPOINTS = '[Endpoints] Disconnect';
export const DISCONNECT_ENDPOINTS_SUCCESS = '[Endpoints] Disconnect succeed';
export const DISCONNECT_ENDPOINTS_FAILED = '[Endpoints] Disconnect failed';

export const REGISTER_ENDPOINTS = '[Endpoints] Register';
export const REGISTER_ENDPOINTS_SUCCESS = '[Endpoints] Register succeed';
export const REGISTER_ENDPOINTS_FAILED = '[Endpoints] Register failed';

export const UNREGISTER_ENDPOINTS = '[Endpoints] Unregister';
export const UNREGISTER_ENDPOINTS_SUCCESS = '[Endpoints] Unregister succeed';
export const UNREGISTER_ENDPOINTS_FAILED = '[Endpoints] Unregister failed';

export const UPDATE_ENDPOINT = '[Endpoints] Update';
export const UPDATE_ENDPOINT_SUCCESS = '[Endpoints] Update succeed';
export const UPDATE_ENDPOINT_FAILED = '[Endpoints] Update failed';

export class EndpointActionComplete implements Action {
  constructor(
    public type: string,
    public guid: string,
    /**
     * Note - The underlying endpoints type (_cf_Endpoint, not _stratos_Endpoint)
     */
    public endpointType: EndpointType,
    public endpoint: EndpointModel | INewlyConnectedEndpointInfo
  ) { }
}

export abstract class BaseEndpointAction implements EntityRequestAction {
  public entityType = endpointEntityType;
  public endpointType = STRATOS_ENDPOINT_TYPE;
  public subType = '';
  public entity = [stratosEntityFactory(endpointEntityType)]
  constructor(public type: string) { }
  actions: string[];
}

export abstract class SingleBaseEndpointAction extends BaseEndpointAction {
  constructor(
    actionType: string,
    public guid: string,
    /**
     * The endpoint type of the endpoint
     *    endpointType = stratos endpoint type... where it will be stored
     *    endpointsType = specific type of the endpoint type... for instance 'metrics'
     */
    public endpointsType?: string
  ) {
    super(actionType);
  }
}

abstract class MultipleBaseEndpointAction extends BaseEndpointAction implements PaginatedAction {
  constructor(
    actionType: string,
    public paginationKey: string
  ) {
    super(actionType);
  }
}

// Different Auth Type support for connecting to Endpoints
export interface AuthParamsUsernamePassword {
  username: string;
  password: string;
}

export interface AuthParamsToken {
  token: string;
}

// All supported auth params types
export type AuthParams = AuthParamsUsernamePassword | AuthParamsToken;

export class GetEndpoint extends SingleBaseEndpointAction {
  constructor(
    guid: string,
  ) {
    super(
      GET_ENDPOINT,
      guid
    )
  }
  actions = [
    GET_ENDPOINT,
    GET_ENDPOINT_SUCCESS,
    GET_ENDPOINT_FAILED
  ];
}

export class GetAllEndpoints extends MultipleBaseEndpointAction {
  public static storeKey = endpointListKey;
  constructor(
    public login = false
  ) {
    super(
      GET_ENDPOINTS,
      GetAllEndpoints.storeKey
    )
  }
  actions = [
    GET_ENDPOINTS,
    GET_ENDPOINTS_SUCCESS,
    GET_ENDPOINTS_FAILED
  ];
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
    page: 1,
    'results-per-page': 50,
  };
}

export class GetAllEndpointsSuccess extends GetAllEndpoints {
  constructor(public payload: NormalizedResponse<EndpointModel>, public login = false) {
    super(login)
  }
  type = GET_ENDPOINTS_SUCCESS;
}

export class ConnectEndpoint extends SingleBaseEndpointAction {
  static UpdatingKey = 'connectingKey'
  constructor(
    guid: string,
    // Note - should not be called endpointType
    connectEndpointType: EndpointType,
    public authType: string,
    public authValues: AuthParams,
    public systemShared: boolean,
    public body: string,
  ) {
    super(
      CONNECT_ENDPOINTS,
      guid,
      connectEndpointType
    );
  }
  updatingKey = ConnectEndpoint.UpdatingKey;
  actions = [
    CONNECT_ENDPOINTS,
    CONNECT_ENDPOINTS_SUCCESS,
    CONNECT_ENDPOINTS_FAILED
  ]
}

export class DisconnectEndpoint extends SingleBaseEndpointAction {
  static UpdatingKey = 'disconnecting'
  constructor(
    guid: string,
    // Note - should not be called endpointType
    disconnectEndpointType: EndpointType,
  ) {
    super(
      DISCONNECT_ENDPOINTS,
      guid,
      disconnectEndpointType
    );
  }
  updatingKey = DisconnectEndpoint.UpdatingKey;
  actions = [
    DISCONNECT_ENDPOINTS,
    DISCONNECT_ENDPOINTS_SUCCESS,
    DISCONNECT_ENDPOINTS_FAILED
  ];
}

export class UnregisterEndpoint extends SingleBaseEndpointAction {
  constructor(
    guid: string,
    // Note - should not be called endpointType
    unregisterEndpointType: EndpointType,
  ) {
    super(
      UNREGISTER_ENDPOINTS,
      guid,
      unregisterEndpointType
    );
  }
  actions = [
    UNREGISTER_ENDPOINTS,
    UNREGISTER_ENDPOINTS_SUCCESS,
    UNREGISTER_ENDPOINTS_FAILED
  ];
}

export class RegisterEndpoint extends SingleBaseEndpointAction {
  constructor(
    // Note - should not be called endpointType
    registerEndpointType: EndpointType,
    public endpointSubType: string = null,
    public name: string,
    public endpoint: string,
    public skipSslValidation: boolean,
    public clientID = '',
    public clientSecret = '',
    public ssoAllowed: boolean,
  ) {
    super(
      REGISTER_ENDPOINTS,
      '<New Endpoint>' + name,
      registerEndpointType
    );
  }
  updatingKey = 'registering'
  actions = [
    REGISTER_ENDPOINTS,
    REGISTER_ENDPOINTS_SUCCESS,
    REGISTER_ENDPOINTS_FAILED
  ];
}

export class UpdateEndpoint extends SingleBaseEndpointAction {
  constructor(
    // Note - should not be called endpointType
    updateEndpointType: EndpointType,
    public id: string,
    public name: string,
    public skipSSL: boolean,
    public setClientInfo: boolean,
    public clientID: string,
    public clientSecret: string,
    public allowSSO: boolean,
  ) {
    super(
      UPDATE_ENDPOINT,
      id,
      updateEndpointType
    );
  }
  updatingKey = 'updating'
  actions = [
    UPDATE_ENDPOINT,
    UPDATE_ENDPOINT_SUCCESS,
    UPDATE_ENDPOINT_FAILED
  ];
}
