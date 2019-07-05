import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { FetchGitHubRepoInfo } from '../actions/github.actions';
import {
  EnvVarStratosProject
} from '../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

export const githubActionBuilders = {
  getRepoInfo: (
    projectEnvVars: EnvVarStratosProject
  ) => new FetchGitHubRepoInfo(projectEnvVars)
} as OrchestratedActionBuilders;
