import { Action } from '@ngrx/store';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { gitBranchesEntityType, gitCommitEntityType } from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { GitSCM } from '../shared/data-services/scm/scm';
import { DockerAppDetails, GitAppDetails, OverrideAppDetails, SourceType } from '../store/types/deploy-application.types';
import { GitBranch, GitCommit } from '../store/types/git.types';

export const SET_APP_SOURCE_DETAILS = '[Deploy App] Application Source';
export const CHECK_PROJECT_EXISTS = '[Deploy App] Check Project exists';
export const PROJECT_DOESNT_EXIST = '[Deploy App] Project Doesn\'t exist';
export const PROJECT_FETCH_FAILED = '[Deploy App] Project Fetch Failed';
export const PROJECT_EXISTS = '[Deploy App] Project exists';
export const FETCH_BRANCHES_FOR_PROJECT = '[Deploy App] Fetch branches';
export const FETCH_BRANCH_FOR_PROJECT = '[Deploy App] Fetch branch';
export const SAVE_APP_DETAILS = '[Deploy App] Save app details';
export const SAVE_APP_OVERRIDE_DETAILS = '[Deploy App] Save app override details';
export const FETCH_COMMIT = '[Deploy App] Fetch commit';
export const FETCH_COMMITS = '[Deploy App] Fetch commits';
export const SET_DEPLOY_CF_SETTINGS = '[Deploy App] Set CF Settings';
export const DELETE_DEPLOY_APP_SECTION = '[Deploy App] Delete section';
export const SET_BRANCH = '[Deploy App] Set branch';
export const SET_DEPLOY_BRANCH = '[Deploy App] Set deploy branch';
export const SET_DEPLOY_COMMIT = '[Deploy App] Set deploy commit';
export const DELETE_COMMIT = '[Deploy App] Delete commit';

export const FETCH_BRANCH_START = '[GitHub] Fetch branch start';
export const FETCH_BRANCH_SUCCESS = '[GitHub] Fetch branch succeeded';
export const FETCH_BRANCH_FAILED = '[GitHub] Fetch branch failed';

export const FETCH_BRANCHES_START = '[GitHub] Fetch branches start';
export const FETCH_BRANCHES_SUCCESS = '[GitHub] Fetch branches succeeded';
export const FETCH_BRANCHES_FAILED = '[GitHub] Fetch branches failed';

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

export class FetchBranchForProject implements EntityRequestAction {
  constructor(public scm: GitSCM, public projectName: string, public guid: string, public branchName: string) {
    this.guid = this.guid || `${scm.getType()}-${this.projectName}-${this.branchName}`
  }
  actions = [
    FETCH_BRANCH_START,
    FETCH_BRANCH_SUCCESS,
    FETCH_BRANCH_FAILED
  ];
  public endpointType = CF_ENDPOINT_TYPE;
  type = FETCH_BRANCH_FOR_PROJECT;
  entityType = gitBranchesEntityType;
}

export class FetchBranchesForProject implements PaginatedAction {
  constructor(public scm: GitSCM, public projectName: string) {
    this.paginationKey = FetchBranchesForProject.createPaginationKey(scm, projectName);
  }
  actions = [
    FETCH_BRANCHES_START,
    FETCH_BRANCHES_SUCCESS,
    FETCH_BRANCHES_FAILED
  ];
  public endpointType = CF_ENDPOINT_TYPE;
  type = FETCH_BRANCHES_FOR_PROJECT;
  entityType = gitBranchesEntityType;
  paginationKey: string;

  static createPaginationKey = (scm: GitSCM, projectName: string) => scm.getType() + ':' + projectName;
}

export class SaveAppDetails implements Action {
  constructor(public git: GitAppDetails, public docker: DockerAppDetails) { }
  type = SAVE_APP_DETAILS;
}

export class SaveAppOverrides implements Action {
  constructor(public appOverrideDetails: OverrideAppDetails) { }
  type = SAVE_APP_OVERRIDE_DETAILS;
}

export class FetchCommit implements EntityRequestAction {
  commit: GitCommit;
  public endpointType = CF_ENDPOINT_TYPE;
  constructor(public scm: GitSCM, public commitSha: string, public projectName: string) { }
  type = FETCH_COMMIT;
  entityType = gitCommitEntityType;
}

export class FetchCommits implements PaginatedAction {

  /**
   * Creates an instance of FetchCommits.
   * @param projectName For example `cloudfoundry-incubator/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(public scm: GitSCM, public projectName: string, public sha: string) {
    this.paginationKey = scm.getType() + projectName + sha;
  }
  actions = [
    '[Deploy App] Fetch commits start',
    '[Deploy App] Fetch commits success',
    '[Deploy App] Fetch commits failed',
  ];
  public endpointType = CF_ENDPOINT_TYPE;
  type = FETCH_COMMITS;
  entityType = gitCommitEntityType;
  paginationKey: string;
  initialParams = {
    'order-direction': 'asc',
    'order-direction-field': 'date',
  };
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
