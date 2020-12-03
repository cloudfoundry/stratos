import { BaseEndpointAuth } from '../../../core/src/core/endpoint-auth';
import { urlValidationExpression } from '../../../core/src/core/utils.service';
import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  UNREGISTER_ENDPOINTS_SUCCESS,
} from '../../../store/src/actions/endpoint.actions';
import { IRequestEntityTypeState } from '../../../store/src/app-state';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import {
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from '../../../store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata } from '../../../store/src/types/user-favorites.types';
import { GitEndpointDetailsComponent } from '../shared/components/git-endpoint-details/git-endpoint-details.component';
import { GitRegistrationComponent } from '../shared/components/git-registration/git-registration.component';
import {
  GitBranchActionBuilders,
  gitBranchActionBuilders,
  GitCommitActionBuilders,
  gitCommitActionBuilders,
  GitRepoActionBuilders,
  gitRepoActionBuilders,
} from './git-action-builders';
import { GIT_ENDPOINT_SUB_TYPES, GIT_ENDPOINT_TYPE, gitEntityFactory } from './git-entity-factory';
import { GitBranch, GitCommit, GitEntity, GitRepo } from './git.public-types';
import { gitBranchesEntityType, gitCommitEntityType, gitRepoEntityType } from './git.types';


function endpointDisconnectRemoveEntitiesReducer() {
  return (state: IRequestEntityTypeState<any>, action: DisconnectEndpoint) => {
    switch (action.type) {
      case DISCONNECT_ENDPOINTS_SUCCESS:
      case UNREGISTER_ENDPOINTS_SUCCESS:
        return deleteEndpointEntities(state, action.guid);
    }
    return state;
  };
}

function deleteEndpointEntities(
  state: IRequestEntityTypeState<GitEntity>,
  endpointGuid: string
) {
  return Object.keys(state).reduce((newEntities, guid) => {
    const entity = state[guid];
    if (entity.endpointGuid !== endpointGuid) {
      newEntities[guid] = entity;
    }
    return newEntities;
  }, {});
}

/**
 * A strongly typed collection of Git Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
class GitEntityCatalog {

  public gitEndpoint: StratosCatalogEndpointEntity;

  public commit: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    GitCommit,
    GitCommitActionBuilders
  >;

  public repo: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    GitRepo,
    GitRepoActionBuilders
  >;

  public branch: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    GitBranch,
    GitBranchActionBuilders
  >;

  constructor() {
    const definition: StratosEndpointExtensionDefinition = {
      type: GIT_ENDPOINT_TYPE,
      label: 'Git',
      labelPlural: 'Git',
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons',
      logoUrl: '/core/assets/Git-logo.png',
      authTypes: [],
      registrationComponent: GitRegistrationComponent,
      registeredLimit: () => 0,
      urlValidationRegexString: urlValidationExpression,
      listDetailsComponent: GitEndpointDetailsComponent,
      subTypes: [
        {
          type: GIT_ENDPOINT_SUB_TYPES.GITHUB,
          label: 'Github',
          labelShort: 'Github',
          authTypes: [{
            ...BaseEndpointAuth.Token,
            help: '/core/assets/connect/github.md',
            config: {
              title: 'Personal Access Token'
            }
          }],
          logoUrl: '/core/assets/endpoint-icons/github-logo.png',
          renderPriority: 50,
          registeredLimit: () => Number.MAX_SAFE_INTEGER,
        },
        {
          type: GIT_ENDPOINT_SUB_TYPES.GITLAB,
          label: 'Gitlab',
          labelShort: 'Gitlab',
          authTypes: [{
            ...BaseEndpointAuth.Bearer,
            help: '/core/assets/connect/gitlab.md',
            config: {
              title: 'Personal Access Token'
            }
          }],
          logoUrl: '/core/assets/endpoint-icons/gitlab-icon-rgb.svg',
          renderPriority: 51,
          registeredLimit: () => Number.MAX_SAFE_INTEGER,
        },
      ]
    };

    this.gitEndpoint = new StratosCatalogEndpointEntity(
      definition,
    );

    this.commit = this.generateGitCommitEntity(definition);
    this.repo = this.generateGitRepoEntity(definition);
    this.branch = this.generateGitBranchEntity(definition);
  }

  private generateGitCommitEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    const definition: IStratosEntityDefinition = {
      type: gitCommitEntityType,
      schema: gitEntityFactory(gitCommitEntityType),
      label: 'Git Commit',
      labelPlural: 'Git Commits',
      endpoint: endpointDefinition,
      nonJetstreamRequest: true,
      // FIXME: This is code from when the git commit get function used generic actions/pipeline. Need to revisit this at some point
      // successfulRequestDataMapper: (data, endpointGuid, guid, entityType, endpointType, action) => {
      //   const metadata = (action.metadata as GitMeta[])[0];
      //   return {
      //     ...metadata.scm.convertCommit(endpointGuid, metadata.projectName, data),
      //     guid: action.guid // This works for single requests... but not for multiple
      //   };
      // },
    };
    return new StratosCatalogEntity<IFavoriteMetadata, GitCommit, GitCommitActionBuilders>(
      definition,
      {
        dataReducers: [
          endpointDisconnectRemoveEntitiesReducer()
        ],
        actionBuilders: gitCommitActionBuilders,
        entityBuilder: {
          getMetadata: ent => ({
            name: ent.commit ? ent.commit.message || ent.sha : ent.sha,
            guid: ent.guid
          }),
          getGuid: metadata => metadata.guid,
        }
      }
    );
  }

  private generateGitRepoEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    const definition: IStratosEntityDefinition = {
      type: gitRepoEntityType,
      schema: gitEntityFactory(gitRepoEntityType),
      label: 'Git Repository',
      labelPlural: 'Git Repositories',
      endpoint: endpointDefinition
    };
    return new StratosCatalogEntity<
      IFavoriteMetadata,
      GitRepo,
      GitRepoActionBuilders
    >(
      definition,
      {
        dataReducers: [
          endpointDisconnectRemoveEntitiesReducer()
        ],
        actionBuilders: gitRepoActionBuilders,
      }
    );
  }

  private generateGitBranchEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    const definition: IStratosEntityDefinition = {
      type: gitBranchesEntityType,
      schema: gitEntityFactory(gitBranchesEntityType),
      label: 'Git Branch',
      labelPlural: 'Git Branches',
      endpoint: endpointDefinition
    };
    return new StratosCatalogEntity<IFavoriteMetadata, GitBranch, GitBranchActionBuilders>(
      definition,
      {
        dataReducers: [
          endpointDisconnectRemoveEntitiesReducer()
        ],
        actionBuilders: gitBranchActionBuilders,
      }
    );
  }

  public allGitEntities(): StratosBaseCatalogEntity[] {
    return [
      this.gitEndpoint,
      this.commit,
      this.repo,
      this.branch
    ];
  }
}
export const gitEntityCatalog: GitEntityCatalog = new GitEntityCatalog();
