import { IRequestAction } from '../types/request.types';
import {
  EnvVarStratosProject
} from '../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { gitRepoSchemaKey } from '../helpers/entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/cf-types';

export const FETCH_GITHUB_REPO = '[Github] Fetch Github repo details';

export class FetchGitHubRepoInfo implements IRequestAction {
  constructor(public stProject: EnvVarStratosProject) { }
  type = FETCH_GITHUB_REPO;
  endpointType = CF_ENDPOINT_TYPE;
  entityType = gitRepoSchemaKey;
}
