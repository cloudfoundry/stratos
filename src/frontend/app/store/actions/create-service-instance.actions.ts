import { Action } from '@ngrx/store';

import { GitAppDetails, SourceType } from '../types/deploy-application.types';
import { GitBranch, GithubCommit } from '../types/github.types';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction } from '../types/request.types';
import { githubBranchesSchemaKey, githubCommitSchemaKey } from '../helpers/entity-factory';

export const SET_SERVICE_PLAN = '[Create SI] Set Plan';

export class SetServicePlan implements Action {
  constructor(public servicePlanGuid: string) { }
  type = SET_SERVICE_PLAN;
}
