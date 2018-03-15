import { Action } from '@ngrx/store';

import { GitAppDetails, SourceType } from '../types/deploy-application.types';
import { GitBranch, GithubCommit } from '../types/github.types';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction } from '../types/request.types';
import { githubBranchesSchemaKey, githubCommitSchemaKey } from '../helpers/entity-factory';

export const SET_APP_SOURCE_DETAILS = '[Deploy App] Application Source';
export const SET_APP_SOURCE_SUB_TYPE = '[Deploy App] Set App Source Sub Type';
export const CHECK_PROJECT_EXISTS = '[Deploy App] Check Projet exists';
export const PROJECT_DOESNT_EXIST = '[Deploy App] Project Doesn\'t exist';
export const PROJECT_EXISTS = '[Deploy App] Project exists';
export const FETCH_BRANCHES_FOR_PROJECT = '[Deploy App] Fetch branches';
export const SAVE_APP_DETAILS = '[Deploy App] Save app details';
export const FETCH_COMMIT = '[Deploy App] Fetch commit';
export const SET_DEPLOY_CF_SETTINGS = '[Deploy App] Set CF Settings';
export const DELETE_DEPLOY_APP_SECTION = '[Deploy App] Delete section';
export const SET_BRANCH = '[Deploy App] Set branch';
export const SET_DEPLOY_BRANCH = '[Deploy App] Set deploy branch';
export const DELETE_COMMIT = '[Deploy App] Delete commit';

export const FETCH_BRANCH_START = '[GitHub] Fetch branch start';
export const FETCH_BRANCH_SUCCESS = '[GitHub] Fetch branch succeeded';
export const FETCH_BRANCH_FAILED = '[GitHub] Fetch branch failed';

export class SetAppSourceDetails implements Action {
  constructor(public sourceType: SourceType) { }
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

export class FetchBranchesForProject implements PaginatedAction {
  constructor(public projectName: string) { }
  actions = [
    FETCH_BRANCH_START,
    FETCH_BRANCH_SUCCESS,
    FETCH_BRANCH_FAILED
  ];
  type = FETCH_BRANCHES_FOR_PROJECT;
  entityKey = githubBranchesSchemaKey;
  paginationKey: 'branches';
}

export class SaveAppDetails implements Action {
  constructor(public appDetails: GitAppDetails) { }
  type = SAVE_APP_DETAILS;
}

export class FetchCommit implements IRequestAction {
  commit: GithubCommit;

  constructor(public commitSha: string, public projectName: string) {
    this.commit = {
      sha: commitSha,
      url: `https://api.github.com/repos/${projectName}/commits/${commitSha}`
    };
  }
  type = FETCH_COMMIT;
  entityKey = githubCommitSchemaKey;
}

export class StoreCFSettings implements Action {
  constructor(public cloudFoundryDetails: any) { }
  type = SET_DEPLOY_CF_SETTINGS;
}

export class DeleteDeployAppSection implements Action {
  constructor() { }
  type = DELETE_DEPLOY_APP_SECTION;
}

export class SetBranch implements Action {
  constructor(private branch: GitBranch) { }
  type = SET_BRANCH;
}

export class SetDeployBranch implements Action {
  constructor(private branch: string) { }
  type = SET_DEPLOY_BRANCH;
}
