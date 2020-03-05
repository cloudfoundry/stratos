import { Action } from '@ngrx/store';
import { UaaSetupData, LocalAdminSetupData } from '../types/uaa-setup.types';

export const SETUP_GET_SCOPES = '[Setup] Setup get scopes';
export const SETUP_SAVE_CONFIG = '[Setup] Setup save';
export const SETUP_SUCCESS = '[Setup] Setup success';
export const SETUP_FAILED = '[Setup] Setup failed';

export class SetupConsoleGetScopes implements Action {
  constructor(
    public setupData: UaaSetupData | LocalAdminSetupData
  ) { }
  type = SETUP_GET_SCOPES;
}

export class SetupSaveConfig extends SetupConsoleGetScopes {
  type = SETUP_SAVE_CONFIG;
}

export class SetupSuccess implements Action {
  constructor(public payload: {}) { }
  type = SETUP_SUCCESS;
}

export class SetupFailed implements Action {
  constructor(public message: string) { }
  type = SETUP_FAILED;
}

