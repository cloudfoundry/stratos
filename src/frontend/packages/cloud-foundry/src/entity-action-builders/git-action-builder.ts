import {
  EntityRequestActionConfig,
  GetMultipleActionBuilder,
  KnownEntityActionBuilder,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
  PaginationRequestActionConfig,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GitSCM } from '../shared/data-services/scm/scm';

// type BaseGitMetaActionFn = (meta: GitMeta) => EntityRequestAction;

export interface GitRepoActionBuildersConfig extends OrchestratedActionBuilderConfig {
  getRepoInfo: EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>;
}

export interface GitRepoActionBuilders extends OrchestratedActionBuilders {
  getRepoInfo: KnownEntityActionBuilder<GitMeta>;
}

export const gitRepoActionBuilders: GitRepoActionBuildersConfig = {
  getRepoInfo: new EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>(
    (guid, endpointGuid, meta: GitMeta) => meta.scm.getRepositoryApiUrl(meta.projectName), // TODO: RC bork this to see broken error message on app github page
    {
      externalRequest: true,
    }
  ),
  // getRepoInfo: (
  //   meta: GitMeta
  // ) => new FetchGitHubRepoInfo(meta)
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
// TODO: RC 6 . why does generic single entity process work without fix?

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
    // TODO: Confirm - if we're just fetching ... how is the guid/id made up??
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

export interface GitBranchActionBuildersConfig extends OrchestratedActionBuilderConfig {
  getFromProject: EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>;
  getMultipleFromProject: PaginationRequestActionConfig<GetMultipleActionBuilder>;
}

export interface GitBranchActionBuilders extends OrchestratedActionBuilders {
  getFromProject: KnownEntityActionBuilder<GitMeta>;
  getMultipleFromProject: GetMultipleActionBuilder<GitMeta>;
}

export const gitBranchActionBuilders: GitBranchActionBuildersConfig = {
  getFromProject: new EntityRequestActionConfig<KnownEntityActionBuilder<GitMeta>>(
    (id, endpointGuid, meta2) => meta2.scm.getBranchApiUrl(meta2.projectName, meta2.branchName),
    {
      externalRequest: true,
    }
  ),
  getMultipleFromProject: new PaginationRequestActionConfig<GetMultipleActionBuilder<GitMeta>>(
    (endpointGuid, paginationKey, meta) => paginationKey || meta.scm.getType() + ':' + meta.projectName,
    (endpointGuid, paginationKey, meta) => meta.scm.getBranchesApiUrl(meta.projectName),
    {
      externalRequest: true,
    }
  )

  // get: (
  //   guid: string,
  //   endpointId: string,
  //   meta: GitMeta
  // ) => new FetchBranchForProject(meta.scm, meta.projectName, guid, meta.branchName),
  // getMultiple: (
  //   endpointGuid: string = null,
  //   paginationKey: string = null,
  //   meta?: GitMeta
  // ) => new FetchBranchesForProject(meta.scm, meta.projectName)
};
