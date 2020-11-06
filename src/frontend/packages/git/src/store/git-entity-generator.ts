import { BaseEndpointAuth } from '../../../core/src/core/endpoint-auth';
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
import { GitRegistrationComponent } from '../shared/components/git-registration/git-registration.component';
import { GitMeta } from '../shared/scm/scm';
import {
  GitBranchActionBuilders,
  gitBranchActionBuilders,
  GitCommitActionBuilders,
  gitCommitActionBuilders,
  GitCommitActionBuildersConfig,
  GitRepoActionBuilders,
  gitRepoActionBuilders,
} from './git-action-builder';
import { GIT_ENDPOINT_SUB_TYPES, GIT_ENDPOINT_TYPE, gitEntityFactory } from './git-entity-factory';
import { GitBranch, GitCommit, GitRepo } from './git.public-types';
import { gitBranchesEntityType, gitCommitEntityType, gitRepoEntityType } from './git.types';

/**
 * A strongly typed collection of Git Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
class GitEntityCatalog {

  public gitEndpoint: StratosCatalogEndpointEntity;

  public commit: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    GitCommit,
    GitCommitActionBuildersConfig,
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
      renderPriority: 20,
      registrationComponent: GitRegistrationComponent,
      subTypes: [
        {
          // TODO: RCuse better images for public/private
          type: GIT_ENDPOINT_SUB_TYPES.PUBLIC_GIT,
          label: 'Public GIT',
          labelShort: 'Public GIT',
          authTypes: [],
          unConnectable: true,
          logoUrl: '/core/assets/Git-logo.png',
          renderPriority: 1,
          registrationComponent: null
        },
        {
          type: GIT_ENDPOINT_SUB_TYPES.PRIVATE_GIT,
          label: 'Private GIT',
          labelShort: 'Private GIT',
          authTypes: [
            BaseEndpointAuth.UsernamePassword, // TODO: RC this should not be username/password
          ],
          logoUrl: '/core/assets/Git-logo.png', // TODO: RC location of all these
          renderPriority: 2,
          registrationComponent: null,
        },
        {
          type: GIT_ENDPOINT_SUB_TYPES.PUBLIC_GITHUB,
          label: 'Public Github',
          labelShort: 'Public Github',
          authTypes: [],
          unConnectable: true,
          logoUrl: '/core/assets/endpoint-icons/github-logo.png',
          renderPriority: 3,
          registeredLimit: () => 1,
          registrationComponent: null
        },
        {
          type: GIT_ENDPOINT_SUB_TYPES.PRIVATE_GITHUB,
          label: 'Private Github',
          labelShort: 'Private Github',
          authTypes: [],
          logoUrl: '/core/assets/endpoint-icons/github-logo.png',
          renderPriority: 4,
          registeredLimit: () => 1,
          registrationComponent: null
        },
        {
          type: GIT_ENDPOINT_SUB_TYPES.PUBLIC_GITLAB,
          label: 'Public Gitlab',
          labelShort: 'Public Gitlab',
          authTypes: [],
          unConnectable: true,
          logoUrl: '/core/assets/endpoint-icons/gitlab-icon-rgb.svg',
          renderPriority: 5,
          registeredLimit: () => 1,
          registrationComponent: null
        },
        {
          type: GIT_ENDPOINT_SUB_TYPES.PRIVATE_GITLAB,
          label: 'Private Gitlab',
          labelShort: 'Private Gitlab',
          authTypes: [],
          logoUrl: '/core/assets/endpoint-icons/gitlab-icon-rgb.svg',
          renderPriority: 6,
          registeredLimit: () => 1,
          registrationComponent: null
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
      successfulRequestDataMapper: (data, endpointGuid, guid, entityType, endpointType, action) => {
        const metadata = (action.metadata as GitMeta[])[0];
        return {
          ...metadata.scm.convertCommit(metadata.projectName, data),
          guid: action.guid
        };
      },
    };
    return new StratosCatalogEntity<IFavoriteMetadata, GitCommit, GitCommitActionBuildersConfig, GitCommitActionBuilders>(
      definition,
      {
        dataReducers: [
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
