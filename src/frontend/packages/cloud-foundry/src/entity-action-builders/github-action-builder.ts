import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import {
  EnvVarStratosProject,
} from '../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { FetchGitHubRepoInfo } from '../actions/github.actions';

export const githubRepoActionBuilders = {
  getRepoInfo: (
    projectEnvVars: EnvVarStratosProject
  ) => new FetchGitHubRepoInfo(projectEnvVars)
} as OrchestratedActionBuilders;
