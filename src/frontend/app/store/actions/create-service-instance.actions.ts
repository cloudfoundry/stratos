import { Action } from '@ngrx/store';

import { GitAppDetails, SourceType } from '../types/deploy-application.types';
import { GitBranch, GithubCommit } from '../types/github.types';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction } from '../types/request.types';
import { githubBranchesSchemaKey, githubCommitSchemaKey } from '../helpers/entity-factory';

export const SET_SERVICE_PLAN = '[Create SI] Set Plan';
export const SET_ORG = '[Create SI] Set Org';
export const SET_SPACE = '[Create SI] Set Space';
export const SET_CREATE_SERVICE_INSTANCE = '[Create SI] Set All';
export const SET_APP = '[Create SI] Set App';
export const SET_SERVICE_INSTANCE_GUID = '[Create SI] Set Service Instance Guid';

export class SetServicePlan implements Action {
  constructor(public servicePlanGuid: string) { }
  type = SET_SERVICE_PLAN;
}
export class SetOrg implements Action {
  constructor(public orgGuid: string) { }
  type = SET_ORG;
}
export class SetSpace implements Action {
  constructor(public spaceGuid: string) { }
  type = SET_SPACE;
}
export class SetApp implements Action {
  constructor(public appGuid: string) { }
  type = SET_APP;
}
export class SetServiceInstanceGuid implements Action {
  constructor(public guid: string) { }
  type = SET_SERVICE_INSTANCE_GUID;
}

export class SetCreateServiceInstance implements Action {
  constructor(public name: string, public spaceGuid: string, public tags: string[], public jsonParams: string) {

  }
  type = SET_CREATE_SERVICE_INSTANCE;
}
