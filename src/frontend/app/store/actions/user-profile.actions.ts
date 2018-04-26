import { schema } from 'normalizr';
import { Action } from '@ngrx/store';

export const GET_USERPROFILE = '[UserProfile] Get';

export class FetchUserProfileAction implements Action {
  url: string;
  type = GET_USERPROFILE;
  constructor(public guid: string) { }
}
