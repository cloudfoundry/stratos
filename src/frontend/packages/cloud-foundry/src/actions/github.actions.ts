import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { gitRepoEntityType } from '../cf-entity-factory';
import {
  EnvVarStratosProject,
} from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { EntityRequestAction } from '../../../store/src/types/request.types';

export const FETCH_GITHUB_REPO = '[Github] Fetch Github repo details';

export class FetchGitHubRepoInfo implements EntityRequestAction {
  constructor(public stProject: EnvVarStratosProject) { }
  type = FETCH_GITHUB_REPO;
  endpointType = CF_ENDPOINT_TYPE;
  entityType = gitRepoEntityType;
}
