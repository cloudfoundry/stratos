import { Action, compose } from '@ngrx/store';

import { AppState } from '../app-state';
import { DeployApplicationSource, GitAppDetails, SourceType } from '../types/deploy-application.types';
import { GithubCommit } from '../types/github.types';

export const SET_APP_SOURCE_DETAILS = '[Deploy App] Application Source';
export const SET_APP_SOURCE_SUB_TYPE = '[Deploy App] Set App Source Sub Type';
export const CHECK_PROJECT_EXISTS = '[Deploy App] Check Projet exists';
export const PROJECT_DOESNT_EXIST = '[Deploy App] Project Doesn\'t exist';
export const PROJECT_EXISTS = '[Deploy App] Project exists';
export const FETCH_BRANCHES_FOR_PROJECT = '[Deploy App] Fetch branches';
export const SAVE_APP_DETAILS = '[Deploy App] Save app details';
export const DELETE_CACHED_BRANCHES = '[Deploy App] Delete cached branches';
export const FETCH_COMMIT = '[Deploy App] Fetch commit';
export const SET_DEPLOY_CF_SETTINGS = '[Deploy App] Set CF Settings';
export const DELETE_DEPLOY_APP_SECTION = '[Deploy App] Delete section';

export class SetAppSourceDetails implements Action {
  constructor(public applicationSource: any) { }
  type = SET_APP_SOURCE_DETAILS;
}

export class SetAppSourceSubType implements Action {
  constructor(public subType: SourceType) { }
  type = SET_APP_SOURCE_SUB_TYPE;
}

export class CheckProjectExists implements Action {
  constructor(public projectName: any) { }
  type = CHECK_PROJECT_EXISTS;
}

export class ProjectDoesntExist implements Action {
  constructor(public projectName: string) { }
  type = PROJECT_DOESNT_EXIST;
}

export class ProjectExists implements Action {
  projectData: any;
  constructor(public projectName: string, private data: any) {
    this.projectData = JSON.parse(data._body);
  }
  type = PROJECT_EXISTS;
}

export class FetchBranchesForProject implements Action {
  constructor(public projectName: string) { }
  type = FETCH_BRANCHES_FOR_PROJECT;
}

export class SaveAppDetails implements Action {
  constructor(public appDetails: GitAppDetails) {
   }
  type = SAVE_APP_DETAILS;
}

export class DeleteCachedBranches implements Action {
  type = DELETE_CACHED_BRANCHES;
}

export class FetchCommit implements Action {
  constructor(public commit: GithubCommit) {}
  type = FETCH_COMMIT;
}

export class StoreCFSettings implements Action {
  constructor(public cloudFoundryDetails: any) {
  }
  type = SET_DEPLOY_CF_SETTINGS;
}


export class DeleteDeployAppSection implements Action {
  constructor() {
  }
  type = DELETE_DEPLOY_APP_SECTION;
}

