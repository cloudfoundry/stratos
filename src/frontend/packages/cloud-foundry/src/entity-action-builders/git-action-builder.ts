import {
  EntityRequestActionConfig,
  KnownEntityActionBuilder,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GitSCM } from '../../../core/src/shared/data-services/scm/scm';
import { FetchBranchesForProject, FetchCommits } from '../actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../actions/github.actions';
import {
  EnvVarStratosProject,
} from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

export const gitRepoActionBuilders = {
  getRepoInfo: (
    projectEnvVars: EnvVarStratosProject
  ) => new FetchGitHubRepoInfo(projectEnvVars)
} as OrchestratedActionBuilders;

interface GitMeta {
  projectName: string;
  scm: GitSCM;
  commitId?: string;
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
    (id, endpointGuid, meta) => meta.scm.getCommitApiUrl(meta.projectName, meta.commitId),
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
  ) => new FetchBranchesForProject(meta.scm, guid)
};
