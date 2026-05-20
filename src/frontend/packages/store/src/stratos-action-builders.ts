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
import { IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';
import { UserProfileInfo, UserProfilePasswordUpdate } from './types/user-profile.types';

export interface SystemInfoActionBuilder extends OrchestratedActionBuilders {
  getSystemInfo: (
    login?: boolean,
  ) => GetSystemInfo;
}
export const systemInfoActionBuilder: SystemInfoActionBuilder = {
  getSystemInfo: (login?: false) => new GetSystemInfo(login)
};

export interface UserFavoriteActionBuilder extends OrchestratedActionBuilders {
  getMultiple: () => GetUserFavoritesAction;
  getAll: () => GetUserFavoritesAction;
  delete: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => RemoveUserFavoriteAction;
  save: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => SaveUserFavoriteAction;
  toggle: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => ToggleUserFavoriteAction;
  updateFavorite: (
    favorite: UserFavorite<IFavoriteMetadata>
  ) => UpdateUserFavoriteMetadataAction;
}

export const userFavoriteActionBuilder: UserFavoriteActionBuilder = {
  getMultiple: () => new GetUserFavoritesAction(),
  getAll: () => new GetUserFavoritesAction(),
  delete: (favorite: UserFavorite<IFavoriteMetadata>) => new RemoveUserFavoriteAction(favorite),
  save: (favorite: UserFavorite<IFavoriteMetadata>) => new SaveUserFavoriteAction(favorite),
  toggle: (favorite: UserFavorite<IFavoriteMetadata>) => new ToggleUserFavoriteAction(favorite),
  updateFavorite: (favorite: UserFavorite<IFavoriteMetadata>) => new UpdateUserFavoriteMetadataAction(favorite)
};

export interface UserProfileActionBuilder extends OrchestratedActionBuilders {
  get: (
    userGuid: string
  ) => FetchUserProfileAction;
  updateProfile: (
    profile: UserProfileInfo,
    password: string
  ) => UpdateUserProfileAction;
  updatePassword: (
    guid: string,
    passwordChanges: UserProfilePasswordUpdate
  ) => UpdateUserPasswordAction;
}
export const userProfileActionBuilder: UserProfileActionBuilder = {
  get: (userGuid: string) => new FetchUserProfileAction(userGuid),
  updateProfile: (profile: UserProfileInfo, password: string) => new UpdateUserProfileAction(profile, password),
  updatePassword: (guid: string, passwordChanges: UserProfilePasswordUpdate) => new UpdateUserPasswordAction(guid, passwordChanges)
};

