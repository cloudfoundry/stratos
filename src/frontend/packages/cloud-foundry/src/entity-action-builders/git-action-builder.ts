import { GitSCM } from '../../../core/src/shared/data-services/scm/scm';
import {
  EntityRequestActionConfig,
  KnownEntityActionBuilder,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchBranchesForProject, FetchCommits } from '../actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../actions/github.actions';
import {
  EnvVarStratosProject,
} from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

export interface GitRepoActionBuilders extends OrchestratedActionBuilders {
  getRepoInfo: (
    projectEnvVars: EnvVarStratosProject
  ) => FetchGitHubRepoInfo;
}

export const gitRepoActionBuilders: GitRepoActionBuilders = {
  getRepoInfo: (
    projectEnvVars: EnvVarStratosProject
  ) => new FetchGitHubRepoInfo(projectEnvVars)
};

export interface GitMeta {
  projectName: string;
  scm: GitSCM;
  commitSha?: string;
}

export interface GitCommitActionBuildersConfig extends OrchestratedActionBuilderConfig {
  get: EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>;
  getMultiple: (commitSha: string, endpointGuid: string, projectMeta: GitMeta) => FetchCommits;
}

export interface GitCommitActionBuilders extends OrchestratedActionBuilders {
  get: KnownEntityActionBuilder<GitMeta>;
  getMultiple: (commitSha: string, endpointGuid: string, projectMeta: GitMeta) => FetchCommits;
}

export const gitCommitActionBuilders: GitCommitActionBuildersConfig = {
  get: new EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>(
    (id, endpointGuid, meta) => meta.scm.getCommitApiUrl(meta.projectName, meta.commitSha),
    {
      externalRequest: true
    }
  ),
  getMultiple: (
    commitSha: string,
    endpointGuid: string,
    commitMeta: GitMeta
  ) => new FetchCommits(commitMeta.scm, commitMeta.projectName, commitSha)
};

export interface GitBranchActionBuilders extends OrchestratedActionBuilders {
  get: (projectName: string, endpointGuid: string, meta: GitMeta) => FetchBranchesForProject;
}

export const gitBranchActionBuilders: GitBranchActionBuilders = {
  get: (
    guid: string,
    endpointGuid: string,
    meta: GitMeta
  ) => new FetchBranchesForProject(meta.scm, meta.projectName)
};
