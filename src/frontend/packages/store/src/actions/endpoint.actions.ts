import { Action } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { EndpointType } from '../../../core/src/core/extension/extension-types';
import { endpointSchemaKey } from '../helpers/stratos-entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { endpointListKey, EndpointModel } from '../types/endpoint.types';
import { PaginatedAction } from '../types/pagination.types';
import { EntityRequestAction } from '../types/request.types';

export const GET_ENDPOINTS = '[Endpoints] Get all';
export const GET_ENDPOINTS_START = '[Endpoints] Get all start'; // TODO: RD HUH
export const GET_ENDPOINTS_LOGIN = '[Endpoints] Get all at login'; // TODO: RD HUH
export const GET_ENDPOINTS_SUCCESS = '[Endpoints] Get all success';
export const GET_ENDPOINTS_FAILED = '[Endpoints] Get all failed';

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

// TODO: RC delete
// export class EndpointActionComplete implements Action {
//   constructor(
//     public type: string,
//     public guid: string,
//     public endpointType: EndpointType,
//     public endpoint: EndpointModel | INewlyConnectedEndpointInfo
//   ) { }
// }


// export class EndpointAction implements Action {
//   type: string;
//   endpointType: EndpointType;
// }

export class GetAllEndpointsSuccess implements Action {
  constructor(public payload: NormalizedResponse<EndpointModel>, public login = false) { }
  type = GET_ENDPOINTS_SUCCESS;
}

abstract class BaseEndpointAction implements EntityRequestAction {
  public entityType = endpointSchemaKey;
  public endpointType = STRATOS_ENDPOINT_TYPE;
  public subType = '';
  constructor(public type: string) { }
  actions: string[];
  // TODO: RC SCHEMAS everywhere
}

abstract class SingleBaseEndpointAction extends BaseEndpointAction {
  constructor(
    type: string,
    public guid: string
  ) {
    super(type);

  }
}

abstract class MultipleBaseEndpointAction extends BaseEndpointAction implements PaginatedAction {
  constructor(
    type: string,
    public paginationKey: string
  ) {
    super(type);

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
    GET_ENDPOINTS_START,
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

export class ConnectEndpoint extends SingleBaseEndpointAction {
  static UpdatingKey = 'connectingKey'
  constructor(
    guid: string,
    public endpointType: EndpointType,
    public authType: string,
    public authValues: AuthParams,
    public systemShared: boolean,
    public body: string,
  ) {
    super(
      CONNECT_ENDPOINTS,
      guid
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
    public endpointType: EndpointType,
  ) {
    super(
      DISCONNECT_ENDPOINTS,
      guid
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
    public endpointType: EndpointType,
  ) {
    super(
      UNREGISTER_ENDPOINTS,
      guid
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
    public endpointType: EndpointType,
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
      '<New Endpoint>' + name
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
    public endpointType: EndpointType, // TODO: RC test different types
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
      id
    );
  }
  updatingKey = 'updating'
  actions = [
    UPDATE_ENDPOINT,
    UPDATE_ENDPOINT_SUCCESS,
    UPDATE_ENDPOINT_FAILED
  ];
}
