import {
  EntityRequestActionConfig,
  GetMultipleActionBuilder,
  KnownEntityActionBuilder,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
  PaginationRequestActionConfig,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchBranchesForProject, FetchBranchForProject } from '../actions/deploy-applications.actions';
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
  scm: GitSCM; // FIXME: Remove from action, see #4245. This should just be 'type' and used GitSCMService (change that to create array on need)
  commitSha?: string;
  branchName?: string;
}

// TODO: RC 1. ~~PaginationRequestActionConfig takes pagination key~~
// TODO: RC 2. ~~why these interface,GitCommitActionBuilders and GitCommitActionBuildersConfig needed?
// one for normal requests... used by typing... other used by builder config approach~~
// TODO: RC 3. ~~access store by type... only works for OrchestratedActionBuilders and not OrchestratedActionBuilderConfig~~
// TODO: RC 4 (Separate) 4245. git commit id process (schema wrong, effect has it... but should move to schema)
// TODO: RC 5 (Separate) 4245. gitscm in action... this can be huge in store. need to pass through type and GitSCMService (but that should
// dynamically create type)

// can handle per entity type and endpoint type error handling

// gitCommitActionBuilders, of type builders config, gets converted into type GitCommitActionBuilders by ActionBuilderConfigMapper

// These are used when we want to create teh action builders... and will result in GitCommitActionBuilders
export interface GitCommitActionBuildersConfig extends OrchestratedActionBuilderConfig {
  get: EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>;
  getMultiple: PaginationRequestActionConfig<GetMultipleActionBuilder>;
}

// These are used when we want to CALL anything action/store related and are created via the GitCommitActionBuildersConfig
export interface GitCommitActionBuilders extends OrchestratedActionBuilders {
  get: KnownEntityActionBuilder<GitMeta>;
  getMultiple: GetMultipleActionBuilder<GitMeta>;
}

export const gitCommitActionBuilders: GitCommitActionBuildersConfig = {
  get: new EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>(
    (id, endpointGuid, meta2) => meta2.scm.getCommitApiUrl(meta2.projectName, meta2.commitSha),
    {
      externalRequest: true,
    }
  ),
  getMultiple: new PaginationRequestActionConfig<GetMultipleActionBuilder<GitMeta>>(
    (endpointGuid, paginationKey, meta) => paginationKey || meta.scm.getType() + meta.projectName + meta.commitSha,
    (endpointGuid, paginationKey, meta) => meta.scm.getCommitsApiUrl(meta.projectName, meta.commitSha),
    {
      externalRequest: true,
    }
  )
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
