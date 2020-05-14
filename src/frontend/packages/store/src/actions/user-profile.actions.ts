import { Action } from '@ngrx/store';

import { userProfileEntitySchema } from '../../../core/src/base-entity-schemas';
import { EntityRequestAction } from '../types/request.types';
import { UserProfileInfo, UserProfilePasswordUpdate } from '../types/user-profile.types';

export const GET_USERPROFILE = '[UserProfile] Get';
export const UPDATE_USERPROFILE = '[UserProfile] Update';
export const UPDATE_USERPASSWORD = '[UserPassword] Update';

export class FetchUserProfileAction implements EntityRequestAction {
  static guid = 'userProfile';
  type = GET_USERPROFILE;
  constructor(public userGuid: string) { }
  entityType = userProfileEntitySchema.entityType;
  endpointType = userProfileEntitySchema.endpointType;
  guid = FetchUserProfileAction.guid;
}

export class UpdateUserProfileAction implements Action {
  type = UPDATE_USERPROFILE;
  constructor(public profile: UserProfileInfo, public password: string) { }
}

export class UpdateUserPasswordAction implements Action {
  type = UPDATE_USERPASSWORD;
  constructor(public id: string, public passwordChanges: UserProfilePasswordUpdate) { }
}
