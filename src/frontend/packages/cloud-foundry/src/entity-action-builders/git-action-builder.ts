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
    (guid, endpointGuid, meta: GitMeta) => meta.scm.getRepositoryApiUrl(meta.projectName), // TODO: RC FIX bork this to see broken error message on app github page
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

// TODO: RC Document - Action builder typing needs improving.
// - OrchestratedActionBuilderConfig interface is used in entity when it's created to dynamically create an instance of OrchestratedActionBuilders
// - OrchestratedActionBuilders interface defines what the end-dev-user can use when accessing actions/store/etc
// - Implementation is usually just of the OrchestratedActionBuilders

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

};
