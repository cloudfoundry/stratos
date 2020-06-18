import { EndpointType } from '../../core/src/core/extension/extension-types';
import {
  AuthParams,
  ConnectEndpoint,
  DisconnectEndpoint,
  GetAllEndpoints,
  RegisterEndpoint,
  UnregisterEndpoint,
  UpdateEndpoint,
} from './actions/endpoint.actions';
import { GetSystemInfo } from './actions/system.actions';
import { FetchUserProfileAction, UpdateUserPasswordAction, UpdateUserProfileAction } from './actions/user-profile.actions';
import { OrchestratedActionBuilders } from './entity-catalog/action-orchestrator/action-orchestrator';
import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EndpointModel } from './types/endpoint.types';
import { UserProfileInfo, UserProfilePasswordUpdate } from './types/user-profile.types';

// TODO: RC Test all of these actions


export interface EndpointActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string
  ) => null, // TODO: RC
  getAll: (
    login?: boolean
  ) => GetAllEndpoints,
  getMultiple: (
    endpointGuid?: string,
    paginationKey?: string,
    args?: { login: boolean }
  ) => GetAllEndpoints,
  connect: (
    guid: string,
    endpointType: EndpointType,
    authType: string,
    authValues: AuthParams,
    systemShared: boolean,
    body: string,
  ) => ConnectEndpoint,
  disconnect: (
    guid: string,
    endpointType: EndpointType,
  ) => DisconnectEndpoint,
  unregister: (
    guid: string,
    endpointType: EndpointType,
  ) => UnregisterEndpoint,
  register: (
    endpointType: EndpointType,
    endpointSubType: string,
    name: string,
    endpoint: string,
    skipSslValidation: boolean,
    clientID?: string,
    clientSecret?: string,
    ssoAllowed?: boolean,
  ) => RegisterEndpoint,
  update: (
    guid: string,
    endpointGuid: string,
    args: {
      endpointType: EndpointType, // TODO: RC test different types
      id: string,
      name: string,
      skipSSL: boolean,
      setClientInfo: boolean,
      clientID: string,
      clientSecret: string,
      allowSSO: boolean,
    }
  ) => UpdateEndpoint,
}
export const endpointActionBuilder: EndpointActionBuilder = {
  get: (guid: string) => null,
  getAll: (login: boolean) => new GetAllEndpoints(login),
  getMultiple: (
    endpointGuid?: string,
    paginationKey?: string,
    args?: { login: boolean }
  ) => new GetAllEndpoints(args ? args.login : false),
  connect: (
    guid: string,
    endpointType: EndpointType,
    authType: string,
    authValues: AuthParams,
    systemShared: boolean,
    body: string,
  ) => new ConnectEndpoint(guid, endpointType, authType, authValues, systemShared, body),
  disconnect: (guid: string, endpointType: EndpointType) => new DisconnectEndpoint(guid, endpointType),
  // TODO: RC not used??????
  unregister: (guid: string, endpointType: EndpointType) => new UnregisterEndpoint(guid, endpointType),
  register: (
    endpointType: EndpointType,
    endpointSubType: string,
    name: string,
    endpoint: string,
    skipSslValidation: boolean,
    clientID?: string,
    clientSecret?: string,
    ssoAllowed?: boolean,
  ) => new RegisterEndpoint(
    endpointType,
    endpointSubType,
    name,
    endpoint,
    skipSslValidation,
    clientID,
    clientSecret,
    ssoAllowed,
  ),
  update: (
    guid: string,
    endpointGuid: string,
    args: {
      endpointType: EndpointType, // TODO: RC test different types
      // id: string,
      name: string,
      skipSSL: boolean,
      setClientInfo: boolean,
      clientID: string,
      clientSecret: string,
      allowSSO: boolean,
    }
  ) => new UpdateEndpoint(
    args.endpointType,
    guid,
    args.name,
    args.skipSSL,
    args.setClientInfo,
    args.clientID,
    args.clientSecret,
    args.allowSSO
  ),
}

export interface SystemInfoActionBuilder extends OrchestratedActionBuilders {
  getSystemInfo: (
    login?: boolean,
    associatedAction?: GetAllEndpoints
  ) => GetSystemInfo
}
export const systemInfoActionBuilder: SystemInfoActionBuilder = {
  getSystemInfo: (
    login?: false,
    associatedAction?: GetAllEndpoints
  ) => new GetSystemInfo(login, associatedAction)
}

export interface UserFavoriteActionBuilder extends OrchestratedActionBuilders {

}

// TODO: Schemas
export interface UserProfileActionBuilder extends OrchestratedActionBuilders {
  get: (
    userGuid: string
  ) => FetchUserProfileAction
  updateProfile: ( // TODO: RC
    profile: UserProfileInfo,
    password: string
  ) => UpdateUserProfileAction
  updatePassword: (
    guid: string,
    passwordChanges: UserProfilePasswordUpdate
  ) => UpdateUserPasswordAction
}
export const userProfileActionBuilder: UserProfileActionBuilder = {
  get: (userGuid: string) => new FetchUserProfileAction(userGuid),
  updateProfile: (profile: UserProfileInfo, password: string) => new UpdateUserProfileAction(profile, password),
  updatePassword: (guid: string, passwordChanges: UserProfilePasswordUpdate) => new UpdateUserPasswordAction(guid, passwordChanges)
}

export class StratosEntityCatalog {
  // TODO: RC transfer types to base-entity-types
  endpoint: StratosCatalogEntity<
    any,//TODO: RC
    EndpointModel,
    EndpointActionBuilder
  >

  systemInfo: StratosCatalogEntity<
    any,
    any, //TODO: RC
    SystemInfoActionBuilder
  >

  userFavorite: StratosCatalogEntity<
    any,
    any, //TODO: RC
    UserFavoriteActionBuilder
  >

  userProfile: StratosCatalogEntity<
    any,
    any, //TODO: RC
    UserProfileActionBuilder
  >

  metricsEndpoint: StratosCatalogEndpointEntity;
}

export const stratosEntityCatalog = new StratosEntityCatalog();

