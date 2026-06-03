import { GetSystemInfo } from './actions/system.actions';
import { FetchUserProfileAction, UpdateUserPasswordAction, UpdateUserProfileAction } from './actions/user-profile.actions';
import { OrchestratedActionBuilders } from './entity-catalog/action-orchestrator/action-orchestrator';
import { UserProfileInfo, UserProfilePasswordUpdate } from './types/user-profile.types';

export interface SystemInfoActionBuilder extends OrchestratedActionBuilders {
  getSystemInfo: (
    login?: boolean,
  ) => GetSystemInfo;
}
export const systemInfoActionBuilder: SystemInfoActionBuilder = {
  getSystemInfo: (login?: false) => new GetSystemInfo(login)
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

