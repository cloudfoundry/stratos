import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import type { GitMeta } from '../shared/scm/scm';
import {
  FetchBranchesForProject,
  FetchBranchForProject,
  FetchCommit,
  FetchCommits,
  FetchGitHubRepoInfo,
} from './git.actions';

export interface GitRepoActionBuilders extends OrchestratedActionBuilders {
  getRepoInfo: (
    meta: GitMeta
  ) => FetchGitHubRepoInfo;
}

export const gitRepoActionBuilders: GitRepoActionBuilders = {
  getRepoInfo: (
    meta: GitMeta
  ) => new FetchGitHubRepoInfo(meta, meta.scm.endpointGuid)
};

// FIXME: This is code from when the git commit get function used generic actions/pipeline. Need to revisit this at some point
// export interface GitCommitActionBuildersConfig extends OrchestratedActionBuilderConfig {
//   get: EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>;
//   getMultiple: (commitSha: string, endpointGuid: string, projectMeta: GitMeta) => FetchCommits;
// }

export interface GitCommitActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    meta?: GitMeta
  ) => FetchCommit;
  getMultiple: (commitSha: string, endpointGuid: string, projectMeta?: GitMeta) => FetchCommits;
}

export const gitCommitActionBuilders: GitCommitActionBuilders = {
  get: (
    _guid: string,
    _endpointGuid: string,
    meta?: GitMeta
  ) => {
    if (!meta) {
      throw new Error('GitMeta is required for gitCommitActionBuilders.get');
    }
    return new FetchCommit(meta.scm, meta.scm.endpointGuid, meta.commitSha, meta.projectName);
  },
  getMultiple: (
    commitSha: string,
    _endpointGuid: string,
    commitMeta?: GitMeta
  ) => {
    if (!commitMeta) {
      throw new Error('GitMeta is required for gitCommitActionBuilders.getMultiple');
    }
    return new FetchCommits(commitMeta.scm, commitMeta.scm.endpointGuid, commitMeta.projectName, commitSha);
  }
};

export interface GitBranchActionBuilders extends OrchestratedActionBuilders {
  /**
   * guid & endpointGuid are optional
   */
  get: (
    guid: string,
    endpointId: string,
    meta?: GitMeta
  ) => FetchBranchForProject;
  /**
   * endpointGuid & paginationKey are optional
   */
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    meta?: GitMeta
  ) => FetchBranchesForProject;
}

export const gitBranchActionBuilders: GitBranchActionBuilders = {
  get: (
    guid: string,
    _endpointId: string,
    meta?: GitMeta
  ) => {
    if (!meta) {
      throw new Error('GitMeta is required for gitBranchActionBuilders.get');
    }
    return new FetchBranchForProject(meta.scm, meta.scm.endpointGuid, meta.projectName, guid, meta.branchName);
  },
  getMultiple: (
    _endpointGuid: string = null,
    _paginationKey: string = null,
    meta?: GitMeta
  ) => {
    if (!meta) {
      throw new Error('GitMeta is required for gitBranchActionBuilders.getMultiple');
    }
    return new FetchBranchesForProject(meta.scm, meta.scm.endpointGuid, meta.projectName);
  }
};
