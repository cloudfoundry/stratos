import { Action } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/src/cf-types';
import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { EndpointType } from '../../../core/src/core/extension/extension-types';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { endpointListKey, EndpointModel, INewlyConnectedEndpointInfo } from '../types/endpoint.types';
import { PaginatedAction } from '../types/pagination.types';

export const GET_ENDPOINTS = '[Endpoints] Get all';
export const GET_ENDPOINTS_START = '[Endpoints] Get all start';
export const GET_ENDPOINTS_LOGIN = '[Endpoints] Get all at login';
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

export class EndpointActionComplete implements Action {
  constructor(
    public type: string,
    public guid: string,
    public endpointType: EndpointType,
    public endpoint: EndpointModel | INewlyConnectedEndpointInfo
  ) { }
}

export class EndpointAction implements Action {
  type: string;
  endpointType: EndpointType = CF_ENDPOINT_TYPE;
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

export class GetAllEndpoints implements PaginatedAction {
  public static storeKey = endpointListKey;
  constructor(public login = false) { }
  entityType = endpointSchemaKey;
  endpointType = STRATOS_ENDPOINT_TYPE;
  paginationKey = GetAllEndpoints.storeKey;
  type = GET_ENDPOINTS;
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

export class GetAllEndpointsSuccess implements Action {
  constructor(public payload: NormalizedResponse<EndpointModel>, public login = false) { }
  type = GET_ENDPOINTS_SUCCESS;
}

export class GetAllEndpointsFailed implements Action {
  constructor(public message: string, public login = false) { }
  type = GET_ENDPOINTS_FAILED;
}

export class ConnectEndpoint extends EndpointAction {
  constructor(
    public guid: string,
    public endpointType: EndpointType,
    public authType: string,
    public authValues: AuthParams,
    public systemShared: boolean,
    public body: string,
  ) {
    super();
  }
  type = CONNECT_ENDPOINTS;
}

export class DisconnectEndpoint extends EndpointAction {
  constructor(
    public guid: string,
    public endpointType: EndpointType,
  ) {
    super();
  }
  type = DISCONNECT_ENDPOINTS;
}

export class UnregisterEndpoint extends EndpointAction {
  constructor(
    public guid: string,
    public endpointType: EndpointType,
  ) {
    super();
  }
  type = UNREGISTER_ENDPOINTS;
}

export class RegisterEndpoint extends EndpointAction {
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
    super();
  }
  type = REGISTER_ENDPOINTS;

  public guid(): string {
    return '<New Endpoint>' + this.name;
  }
}

export class UpdateEndpoint extends EndpointAction {

  type = UPDATE_ENDPOINT;

  constructor(
    public id: string,
    public name: string,
    public skipSSL: boolean,
    public setClientInfo: boolean,
    public clientID: string,
    public clientSecret: string,
    public allowSSO: boolean,
  ) {
    super();
  }
}
