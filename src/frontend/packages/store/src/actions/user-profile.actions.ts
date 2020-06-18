import { userProfileEntitySchema } from '../../../core/src/base-entity-schemas';
import { userProfilePasswordUpdatingKey } from '../effects/user-profile.effects';
import { rootUpdatingKey } from '../reducers/api-request-reducer/types';
import { EntityRequestAction } from '../types/request.types';
import { UserProfileInfo, UserProfilePasswordUpdate } from '../types/user-profile.types';

export const GET_USERPROFILE = '[UserProfile] Get';
export const UPDATE_USERPROFILE = '[UserProfile] Update';
export const UPDATE_USERPASSWORD = '[UserPassword] Update';

abstract class BaseProfileAction implements EntityRequestAction {
  static guid = 'userProfile';
  guid = BaseProfileAction.guid;
  entityType = userProfileEntitySchema.entityType;
  endpointType = userProfileEntitySchema.endpointType;
  constructor(public type: string) { }
}

export class FetchUserProfileAction extends BaseProfileAction {
  constructor(public userGuid: string) {
    super(GET_USERPROFILE);
  }
}

export class UpdateUserProfileAction extends BaseProfileAction {
  constructor(public profile: UserProfileInfo, public password: string) {
    super(UPDATE_USERPROFILE)
  }
  updatingKey = rootUpdatingKey
}

export class UpdateUserPasswordAction extends BaseProfileAction {
  constructor(public id: string, public passwordChanges: UserProfilePasswordUpdate) {
    super(UPDATE_USERPASSWORD);
  }
  updatingKey = userProfilePasswordUpdatingKey
}
