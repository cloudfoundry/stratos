import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { SourceType } from '../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { PermissionConfig } from '../../../../../core/src/core/permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { GitSCM, GitSCMService } from '../../../../../git/src/public_api';
import { GIT_ENDPOINT_SUB_TYPES, GIT_ENDPOINT_TYPE } from '../../../../../git/src/store/git-entity-factory';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { EndpointModel } from '../../../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { CFFeatureFlagTypes } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { CfPermissionTypes } from '../../../user-permissions/cf-user-permissions-checkers';

export enum DEPLOY_TYPES_IDS {
  GITLAB = 'gitlab',
  GITHUB = 'github',
  GIT_URL = 'giturl',
  DOCKER_IMG = 'dockerimg',
  FILE = 'file',
  FOLDER = 'folder'
}

export const AUTO_SELECT_DEPLOY_TYPE_URL_PARAM = 'auto-select-deploy';
export const AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM = 'auto-select-deploy-endpoint';

@Injectable()
export class ApplicationDeploySourceTypes {

  private baseTypes: SourceType[] = [
    {
      name: 'GitHub',
      id: DEPLOY_TYPES_IDS.GITHUB,
      group: 'gitscm',
      helpText: 'Please select the GitHub project and branch you would like to deploy from.',
      graphic: {
        // TODO: Move cf assets to CF package (#3769)
        location: '/core/assets/endpoint-icons/github-logo.png',
        transform: 'scale(0.7)'
      }
    },
    {
      name: 'GitLab',
      id: DEPLOY_TYPES_IDS.GITLAB,
      group: 'gitscm',
      helpText: 'Please select the GitLab project and branch you would like to deploy from.',
      graphic: {
        location: '/core/assets/endpoint-icons/gitlab-icon-rgb.svg'
      }
    },
    {
      name: 'Public Git URL',
      id: DEPLOY_TYPES_IDS.GIT_URL,
      helpText: 'Please enter the public git url and branch or tag you would like to deploy from.',
      graphic: {
        location: '/core/assets/endpoint-icons/Git-logo.png',
        transform: 'scale(0.7)'
      }
    },
    {
      name: 'Docker Image',
      id: DEPLOY_TYPES_IDS.DOCKER_IMG,
      helpText: 'Please specify an application name and the Docker image to be used (registry/org/image-name).',
      graphic: {
        location: '/core/assets/endpoint-icons/docker.png',
        transform: 'scale(0.8)'
      },
      disabledText: 'The selected Cloud Foundry cannot deploy Docker images. Please check that the Diego Docker feature flag is enabled'
    },
    {
      name: 'Application Archive',
      id: DEPLOY_TYPES_IDS.FILE,
      helpText: 'Please select the archive file that contains the application you would like to deploy.',
      graphic: { matIcon: 'unarchive' }
    },
    {
      name: 'Application Folder',
      id: DEPLOY_TYPES_IDS.FOLDER,
      helpText: 'Please select the folder that contains the application you would like to deploy.',
      graphic: { matIcon: 'folder' }
    },
  ];
  public types$: Observable<SourceType[]>;


  constructor(
    private perms: CurrentUserPermissionsService,
    private scmService: GitSCMService
  ) {
    this.types$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
      filter(e => !!e),
      first(),
      map(endpoints => {
        // Supplement the base github/gitlab with endpoint guid if added by the user. This means we cna use their creds when requesting info
        // to avoid rate limiting
        return { endpoints, types: this.baseTypes.map(t => this.updateGitSourceTypeFromEndpoint(t, endpoints)) };
      }),
      map(({ endpoints, types }) => endpoints.reduce((res, e) => {
        // Supplement the base types with git sources that were manually added by the user as github/gitlab endpoints
        const newType = this.createGitSourceTypeFromEndpoint(e);
        if (newType) {
          res.push(newType);
        }
        return res;
      }, [...types])),
      publishReplay(1),
      refCount()
    );
  }

  /**
   * Supplement the base github/gitlab type with endpoint guid if added by the user. This means we cna use their creds when requesting info
   * to avoid rate limiting
   */
  private updateGitSourceTypeFromEndpoint(type: SourceType, endpoints: EndpointModel[]): SourceType {
    const endpoint = endpoints.find(e =>
      (e.cnsi_type === GIT_ENDPOINT_TYPE) &&
      ((type.id === DEPLOY_TYPES_IDS.GITHUB && e.sub_type === GIT_ENDPOINT_SUB_TYPES.GITHUB) ||
        (type.id === DEPLOY_TYPES_IDS.GITLAB && e.sub_type === GIT_ENDPOINT_SUB_TYPES.GITLAB))
    );

    return endpoint ? {
      ...type,
      endpointGuid: endpoint.guid
    } : type;
  }

  /**
   * Supplement the base types with git sources manually added by the user as github/gitlab endpoints
   */
  private createGitSourceTypeFromEndpoint(endpoint: EndpointModel): SourceType {
    const { scm, type } = this.getScmFromEndpoint(endpoint);
    // I.E. It's a custom/new git address
    if (!scm) {
      // Unknown git type
      return;
    }

    const endpointUrl = getFullEndpointApiUrl(endpoint);
    if (endpointUrl !== scm.getPublicApi()) {
      // This is a custom instance of a git type, use similar settings to the public
      return {
        ...this.baseTypes.find(t => t.id === type),
        name: `Private - ${endpoint.name}`,
        endpointGuid: endpoint.guid
      };
    }
  }

  private getScmFromEndpoint(endpoint: EndpointModel): { scm: GitSCM, type: DEPLOY_TYPES_IDS; } {
    if (!endpoint || endpoint.cnsi_type !== GIT_ENDPOINT_TYPE || !endpoint.user) {
      return {
        scm: null,
        type: null
      };
    }

    return endpoint.sub_type === GIT_ENDPOINT_SUB_TYPES.GITHUB ?
      {
        scm: this.scmService.getSCM('github', null),
        type: DEPLOY_TYPES_IDS.GITHUB
      } :
      endpoint.sub_type === GIT_ENDPOINT_SUB_TYPES.GITLAB ? {
        scm: this.scmService.getSCM('gitlab', null),
        type: DEPLOY_TYPES_IDS.GITLAB
      } : {
          scm: null,
          type: null
        };
  }


  getAutoSelectedType(activatedRoute: ActivatedRoute): Observable<SourceType> {
    const typeId = activatedRoute.snapshot.queryParams[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM];
    if (!typeId) {
      return of(null);
    }
    const endpointGuid = activatedRoute.snapshot.queryParams[AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM];
    return this.types$.pipe(map(types => types.find(source => source.id === typeId && source.endpointGuid === endpointGuid)));
  }

  canDeployType(cfId: string, sourceId: string): Observable<boolean> {
    if (sourceId === DEPLOY_TYPES_IDS.DOCKER_IMG) {
      // We don't want to return until we have a trusted response (there's a `startsWith(false)` in the `.can`), otherwise we return false
      // then, if different, send the actual response (this leads to flashing misleading info in ux)
      // So fetch the feature flags for the cf, which is the blocker, first before checking if we `.can`
      const fetchedFeatureFlags$ = cfEntityCatalog.featureFlag.store.getPaginationService(cfId).entities$.pipe(
        map(entities => !!entities),
        filter(hasEntities => hasEntities),
        first(),
        publishReplay(1),
        refCount(),
      );

      const canDeployWithDocker$ = this.perms.can(
        new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.diego_docker), cfId
      ).pipe(
        publishReplay(1),
        refCount(),
      );

      return fetchedFeatureFlags$.pipe(
        switchMap(() => canDeployWithDocker$),
      );
    }
    return of(true);
  }
}
