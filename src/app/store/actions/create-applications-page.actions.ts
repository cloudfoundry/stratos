import { Action, compose } from '@ngrx/store';

import { AppState } from '../app-state';
import { CreateNewApplicationState } from '../reducers/create-application.reducer';

export const SET_CF_DETAILS = '[Create App Page] Set Cloud Foundry details';
export const SET_NAME = '[Create App Page] Set name';
export const CHECK_NAME = '[Create App Page] Check application name';
export const NAME_TAKEN = '[Create App Page] Application name taken';
export const NAME_FREE = '[Create App Page] Application name free';


export interface NewAppCFDetails {
    cloudFoundry: any;
    org: any;
    space: any;
}

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

export const selectNewAppDetails = (state: AppState) => state.createApplication;

export const getNewAppCFDetails = (state: CreateNewApplicationState) => state.cloudFoundryDetails;

export const getNewAppCFName = (state: CreateNewApplicationState) => state.name;

export const selectNewAppCFDetails = compose(
    getNewAppCFDetails,
    selectNewAppDetails
);

export const selectNewAppCFName = compose(
    getNewAppCFName,
    selectNewAppDetails
);


