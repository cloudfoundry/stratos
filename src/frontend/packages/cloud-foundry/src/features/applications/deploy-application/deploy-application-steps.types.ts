import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { SourceType } from '../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { PermissionConfig } from '../../../../../core/src/core/permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { CFFeatureFlagTypes } from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
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

@Injectable()
export class ApplicationDeploySourceTypes {

  private types: SourceType[] = [
    {
      name: 'Public GitHub',
      id: DEPLOY_TYPES_IDS.GITHUB,
      group: 'gitscm',
      helpText: 'Please select the public GitHub project and branch you would like to deploy from.',
      graphic: {
        // TODO: Move cf assets to CF package (#3769)
        location: '/core/assets/endpoint-icons/github-logo.png'
      }
    },
    {
      name: 'Public GitLab',
      id: DEPLOY_TYPES_IDS.GITLAB,
      group: 'gitscm',
      helpText: 'Please select the public GitLab project and branch you would like to deploy from.',
      graphic: {
        location: '/core/assets/endpoint-icons/gitlab-icon-rgb.svg'
      }
    },
    {
      name: 'Public Git URL',
      id: DEPLOY_TYPES_IDS.GIT_URL,
      helpText: 'Please enter the public git url and branch or tag you would like to deploy from.',
      graphic: {
        location: '/core/assets/endpoint-icons/Git-logo.png'
      }
    },
    {
      name: 'Docker Image',
      id: DEPLOY_TYPES_IDS.DOCKER_IMG,
      helpText: 'Please specify an application name and the Docker image to be used (registry/org/image-name).',
      graphic: {
        location: '/core/assets/endpoint-icons/docker.png'
      },
      disabledText: 'The selected Cloud Foundry cannot deploy Docker images. Please check that the Diego Docker feature flag is enabled'
    },
    {
      name: 'Application Archive File',
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

  constructor(
    private perms: CurrentUserPermissionsService,
    private store: Store<CFAppState>,
  ) { }

  getTypes(): SourceType[] {
    return [
      ...this.types
    ];
  }


  getAutoSelectedType(activatedRoute: ActivatedRoute): SourceType {
    const typeId = activatedRoute.snapshot.queryParams[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM];
    return typeId ? this.getTypes().find(source => source.id === typeId) : null;
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
