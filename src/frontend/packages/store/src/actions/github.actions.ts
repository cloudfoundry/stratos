import { githubRepoSchemaKey } from '../helpers/entity-factory';
import { IRequestAction } from '../types/request.types';
import {
  EnvVarStratosProject
} from '../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

export const FETCH_GITHUB_REPO = '[Github] Fetch Github repo details';

export class FetchGitHubRepoInfo implements IRequestAction {
  constructor(public stProject: EnvVarStratosProject) { }
  type = FETCH_GITHUB_REPO;
  entityKey = githubRepoSchemaKey;
}
