import {
  AuthParams,
  BaseEndpointAction,
  ConnectEndpoint,
  DisconnectEndpoint,
  GetAllEndpoints,
  GetEndpoint,
  RegisterEndpoint,
  UnregisterEndpoint,
  UpdateEndpoint,
} from './actions/endpoint.actions';
import { GetSystemInfo } from './actions/system.actions';
import {
  GetUserFavoritesAction,
  RemoveUserFavoriteAction,
  SaveUserFavoriteAction,
  ToggleUserFavoriteAction,
  UpdateUserFavoriteMetadataAction,
} from './actions/user-favourites.actions';
import { FetchUserProfileAction, UpdateUserPasswordAction, UpdateUserProfileAction } from './actions/user-profile.actions';
import { OrchestratedActionBuilders } from './entity-catalog/action-orchestrator/action-orchestrator';
import { EndpointType } from './extension-types';
import { IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';
import { UserProfileInfo, UserProfilePasswordUpdate } from './types/user-profile.types';

export interface EndpointActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string,
  ) => GetEndpoint,
  getAll: (
    login?: boolean,
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
      endpointType: EndpointType,
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
  get: (guid: string) => new GetEndpoint(guid),
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
      endpointType: EndpointType,
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
    associatedAction?: BaseEndpointAction
  ) => GetSystemInfo
}
export const systemInfoActionBuilder: SystemInfoActionBuilder = {
  getSystemInfo: (
    login?: false,
    associatedAction?: BaseEndpointAction
  ) => new GetSystemInfo(login, associatedAction)
}

export interface UserFavoriteActionBuilder extends OrchestratedActionBuilders {
  getMultiple: () => GetUserFavoritesAction,
  getAll: () => GetUserFavoritesAction,
  delete: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => RemoveUserFavoriteAction,
  save: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => SaveUserFavoriteAction,
  toggle: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => ToggleUserFavoriteAction
  updateFavorite: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => UpdateUserFavoriteMetadataAction
}

export const userFavoriteActionBuilder: UserFavoriteActionBuilder = {
  getMultiple: () => new GetUserFavoritesAction(),
  getAll: () => new GetUserFavoritesAction(),
  delete: (favorite: UserFavorite<IFavoriteMetadata>) => new RemoveUserFavoriteAction(favorite),
  save: (favorite: UserFavorite<IFavoriteMetadata>) => new SaveUserFavoriteAction(favorite),
  toggle: (favorite: UserFavorite<IFavoriteMetadata>) => new ToggleUserFavoriteAction(favorite),
  updateFavorite: (favorite: UserFavorite<IFavoriteMetadata>) => new UpdateUserFavoriteMetadataAction(favorite)
}

export interface UserProfileActionBuilder extends OrchestratedActionBuilders {
  get: (
    userGuid: string
  ) => FetchUserProfileAction
  updateProfile: (
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