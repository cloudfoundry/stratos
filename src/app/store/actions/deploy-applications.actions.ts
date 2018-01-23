import { Action, compose } from '@ngrx/store';

import { AppState } from '../app-state';
import { DeployApplicationSource, GitAppDetails, Commit } from '../types/deploy-application.types';

export const SET_APP_SOURCE_DETAILS = '[Deploy App] Application Source';
export const SET_APP_SOURCE_SUB_TYPE = '[Deploy App] Set App Source Sub Type';
export const CHECK_PROJECT_EXISTS = '[Deploy App] Check Projet exists';
export const PROJECT_DOESNT_EXIST = '[Deploy App] Project Doesn\'t exist';
export const PROJECT_EXISTS = '[Deploy App] Project exists';
export const FETCH_BRANCHES_FOR_PROJECT = '[Deploy App] Fetch branches';
export const SAVE_BRANCHES_FOR_PROJECT = '[Deploy App] Save branches';
export const FAILED_TO_FETCH_BRANCHES = '[Deploy App] Failed to fetch branches';
export const SAVE_APP_DETAILS = '[Deploy App] Save app details';
export const DELETE_CACHED_BRANCHES = '[Deploy App] Delete cached branches';
export const FETCH_COMMIT = '[Deploy App] Fetch commit';
export const SAVE_COMMIT = '[Deploy App] Save commit';
export const FAILED_COMMITS_FETCH = '[Deploy App] Failed to fetch commits';
export const SET_DEPLOY_CF_SETTINGS = '[Deploy App] Set CF Settings';

export class SetAppSourceDetails implements Action {
  constructor(public applicationSource: any) { }
  type = SET_APP_SOURCE_DETAILS;
}

export class SetAppSourceSubType implements Action {
  constructor(public subType: string) { }
  type = SET_APP_SOURCE_SUB_TYPE;
}

export class CheckProjectExists implements Action {
  constructor(public projectName: any) { }
  type = CHECK_PROJECT_EXISTS;
}

export class ProjectDoesntExist implements Action {
  constructor(private projectName: string) { }
  type = PROJECT_DOESNT_EXIST;
}

export class ProjectExists implements Action {
  projectData: any;
  constructor(private projectName: string, private data: any) {
    this.projectData = JSON.parse(data._body);
  }
  type = PROJECT_EXISTS;
}

export class FetchBranchesForProject implements Action {
  constructor(private projectName: string) { }
  type = FETCH_BRANCHES_FOR_PROJECT;
}

export class SaveBranchesForProject implements Action {

  branches: any;
  constructor(private branchesResponse: any) {
    this.branches = JSON.parse(branchesResponse._body);
   }
  type = SAVE_BRANCHES_FOR_PROJECT;
}

export class FetchBranchesFailed implements Action {
  constructor() {
   }
  type = FAILED_TO_FETCH_BRANCHES;
}

export class SaveAppDetails implements Action {
  constructor(private appDetails: GitAppDetails) {
   }
  type = SAVE_APP_DETAILS;
}

export class DeleteCachedBranches implements Action {
  type = DELETE_CACHED_BRANCHES;
}

export class FetchCommit implements Action {
  constructor(private commit: Commit) {}
  type = FETCH_COMMIT;
}

export class SaveCommitForBranch implements Action {
  commitData: any;
  constructor(private data: any) {
    this.commitData = JSON.parse(data._body);
  }
  type = SAVE_COMMIT;
}

export class CommitFetchFailed implements Action {
  type = FAILED_COMMITS_FETCH;
}

export class StoreCFSettings implements Action {
  constructor(private cloudFoundryDetails: any) {
  }
  type = SET_DEPLOY_CF_SETTINGS;
}

