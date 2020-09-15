import { Action } from '@ngrx/store';

import { NewAppCFDetails } from '../store/types/create-application.types';

export const SET_CF_DETAILS = '[Create App Page] Set Cloud Foundry details';
export const SET_NAME = '[Create App Page] Set name';
export const CHECK_NAME = '[Create App Page] Check application name';
export const NAME_TAKEN = '[Create App Page] Application name taken';
export const NAME_FREE = '[Create App Page] Application name free';

export class SetCFDetails implements Action {
  constructor(public cloudFoundryDetails: NewAppCFDetails) { }
  type = SET_CF_DETAILS;
}

export class SetNewAppName implements Action {
  constructor(public name: string) { }
  type = SET_NAME;
}

export class IsNewAppNameFree implements Action {
  constructor(public name: string) { }
  type = CHECK_NAME;
}

export class AppNameTaken implements Action {
  constructor(private name: string) { }
  type = NAME_TAKEN;
}

export class AppNameFree implements Action {
  constructor(private name: string) { }
  type = NAME_FREE;
}
