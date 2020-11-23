import { Action } from '@ngrx/store';
import { GitBranch, GitSCM } from '@stratosui/git';

import { DockerAppDetails, GitAppDetails, OverrideAppDetails, SourceType } from '../store/types/deploy-application.types';

export const SET_APP_SOURCE_DETAILS = '[Deploy App] Application Source';
export const CHECK_PROJECT_EXISTS = '[Deploy App] Check Project exists';
export const PROJECT_DOESNT_EXIST = '[Deploy App] Project Doesn\'t exist';
export const PROJECT_FETCH_FAILED = '[Deploy App] Project Fetch Failed';
export const PROJECT_EXISTS = '[Deploy App] Project exists';
export const SAVE_APP_DETAILS = '[Deploy App] Save app details';
export const SAVE_APP_OVERRIDE_DETAILS = '[Deploy App] Save app override details';
export const SET_DEPLOY_CF_SETTINGS = '[Deploy App] Set CF Settings';
export const DELETE_DEPLOY_APP_SECTION = '[Deploy App] Delete section';
export const SET_BRANCH = '[Deploy App] Set branch';
export const SET_DEPLOY_BRANCH = '[Deploy App] Set deploy branch';
export const SET_DEPLOY_COMMIT = '[Deploy App] Set deploy commit';
export const DELETE_COMMIT = '[Deploy App] Delete commit';

export class SetAppSourceDetails implements Action {
  constructor(public sourceType: SourceType) { }
  type = SET_APP_SOURCE_DETAILS;
}

export class CheckProjectExists implements Action {
  constructor(public scm: GitSCM, public projectName: any) { }
  type = CHECK_PROJECT_EXISTS;
}

export class ProjectDoesntExist implements Action {
  constructor(public projectName: string) { }
  type = PROJECT_DOESNT_EXIST;
}

export class ProjectFetchFail implements Action {
  constructor(public projectName: string, public error: string) { }
  type = PROJECT_FETCH_FAILED;
}

export class ProjectExists implements Action {
  constructor(public projectName: string, public projectData: any) { }
  type = PROJECT_EXISTS;
}

export class SaveAppDetails implements Action {
  constructor(public git: GitAppDetails, public docker: DockerAppDetails) { }
  type = SAVE_APP_DETAILS;
}

export class SaveAppOverrides implements Action {
  constructor(public appOverrideDetails: OverrideAppDetails) { }
  type = SAVE_APP_OVERRIDE_DETAILS;
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

export class SetDeployCommit implements Action {
  constructor(private commit: string) { }
  type = SET_DEPLOY_COMMIT;
}
