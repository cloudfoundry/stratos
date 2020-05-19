import {
  EntityRequestActionConfig,
  KnownEntityActionBuilder,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchBranchesForProject, FetchBranchForProject, FetchCommits } from '../actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../actions/github.actions';
import { GitSCM } from '../shared/data-services/scm/scm';

export interface GitRepoActionBuilders extends OrchestratedActionBuilders {
  getRepoInfo: (
    meta: GitMeta
  ) => FetchGitHubRepoInfo;
}

export const gitRepoActionBuilders: GitRepoActionBuilders = {
  getRepoInfo: (
    meta: GitMeta
  ) => new FetchGitHubRepoInfo(meta)
};

export interface GitMeta {
  projectName: string;
  scm: GitSCM; // FIXME: Remove from action, see #4245
  commitSha?: string;
  branchName?: string;
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
  /**
   * guid & endpointGuid are optional
   */
  get: (
    guid: string,
    endpointId: string,
    meta: GitMeta
  ) => FetchBranchForProject;
  /**
   * endpointGuid & paginationKey are optional
   */
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    meta: GitMeta
  ) => FetchBranchesForProject;
}

export const gitBranchActionBuilders: GitBranchActionBuilders = {
  get: (
    guid: string,
    endpointId: string,
    meta: GitMeta
  ) => new FetchBranchForProject(meta.scm, meta.projectName, guid, meta.branchName),
  getMultiple: (
    endpointGuid: string = null,
    paginationKey: string = null,
    meta?: GitMeta
  ) => new FetchBranchesForProject(meta.scm, meta.projectName)
};
