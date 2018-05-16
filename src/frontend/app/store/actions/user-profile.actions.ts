import { schema } from 'normalizr';
import { Action } from '@ngrx/store';
import { UserProfileInfo, UserProfilePasswordUpdate } from '../types/user-profile.types';

export const GET_USERPROFILE = '[UserProfile] Get';
export const UPDATE_USERPROFILE = '[UserProfile] Update';
export const UPDATE_USERPASSWORD = '[UserPassword] Update';

export class FetchUserProfileAction implements Action {
  type = GET_USERPROFILE;
  constructor(public guid: string) { }
}

export class UpdateUserProfileAction implements Action {
  type = UPDATE_USERPROFILE;
  constructor(public profile: UserProfileInfo, public password: string) { }
}

export class UpdateUserPasswordAction implements Action {
  type = UPDATE_USERPASSWORD;
  constructor(public id: string, public passwordChanges: UserProfilePasswordUpdate) { }
}
