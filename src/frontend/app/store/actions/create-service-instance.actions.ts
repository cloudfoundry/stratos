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
export const SET_CREATE_SERVICE_INSTANC_CF_DETAILS = '[Create SI] Set CF Details';
export const SET_APP = '[Create SI] Set App';
export const SET_SERVICE_INSTANCE_GUID = '[Create SI] Set Service Instance Guid';
export const SET_SERVICE_INSTANCE_SPACE_SCOPED = '[Create SI] Set Service Instance Space Scoped Property';
export const SET_SERVICE_INSTANCE_SVC_GUID = '[Create SI] Set Service Instance Service Guid';
export const SET_SERVICE_INSTANCE_APP = '[Create SI] Set Service Instance App';

export class SetServicePlan implements Action {
  constructor(public servicePlanGuid: string) { }
  type = SET_SERVICE_PLAN;
}
export class SetCreateServiceInstanceOrg implements Action {
  constructor(public orgGuid: string) { }
  type = SET_ORG;
}
export class SetCreateServiceInstanceSpace implements Action {
  constructor(public spaceGuid: string) { }
  type = SET_SPACE;
}
export class SetServiceInstanceGuid implements Action {
  constructor(public guid: string) { }
  type = SET_SERVICE_INSTANCE_GUID;
}
export class SetCreateServiceInstanceSpaceScoped implements Action {
  constructor(public spaceScoped: boolean, public spaceGuid: string = null) { }
  type = SET_SERVICE_INSTANCE_SPACE_SCOPED;
}
export class SetCreateServiceInstanceServiceGuid implements Action {
  constructor(public serviceGuid: string = null) { }
  type = SET_SERVICE_INSTANCE_SVC_GUID;
}

export class SetCreateServiceInstanceApp implements Action {
  constructor(public appGuid: string = null, public params: {}) {
  }
  type = SET_SERVICE_INSTANCE_APP;
}

export class SetCreateServiceInstance implements Action {
  constructor(
    public name: string,
    public spaceGuid: string,
    public tags: string[],
    public jsonParams: string,
    public spaceScoped: boolean = false) {

  }
  type = SET_CREATE_SERVICE_INSTANCE;
}
export class SetCreateServiceInstanceCFDetails implements Action {
  constructor(
    public cfGuid: string,
    public orgGuid: string = null,
    public spaceGuid: string = null
  ) {

  }
  type = SET_CREATE_SERVICE_INSTANC_CF_DETAILS;
}
