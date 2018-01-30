import { Action } from '@ngrx/store';
import {
  EnvVarStratosProject
} from '../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

export const FETCH_GITHUB_REPO = '[Github] Fetch Github repo details';

export class FetchGitHubRepoInfo implements Action {
  constructor(public stProject: EnvVarStratosProject) { }
  type = FETCH_GITHUB_REPO;
}
