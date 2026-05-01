import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GitCommit, gitEntityCatalog, GitRepo, GitSCMService, GitSCMType, SCMIcon } from '@stratosui/git';
import { combineLatest as observableCombineLatest, Observable, of } from 'rxjs';
import { combineLatest, distinct, map, startWith, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  MetadataItemComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
  MbToHumanSizePipe,
  UptimePipe } from '@stratosui/core';
import { getFullEndpointApiUrl, EntityInfo } from '@stratosui/store';
import { IAppSummary } from '../../../../../../cf-api.types';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { ApplicationData, ApplicationService } from '../../../../application.service';
import { DEPLOY_TYPES_IDS } from '../../../../deploy-application/deploy-application-steps.types';
import { CardAppStatusComponent } from '../../../../../../shared/components/cards/card-app-status/card-app-status.component';
import { CardAppInstancesComponent } from '../../../../../../shared/components/cards/card-app-instances/card-app-instances.component';
import { CardAppUptimeComponent } from '../../../../../../shared/components/cards/card-app-uptime/card-app-uptime.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';
import { EnvVarStratosProjectSource } from './application-env-vars.service';

const isDockerHubRegEx = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)/g;

interface CustomEnvVarStratosProjectSource extends EnvVarStratosProjectSource {
  label?: string;
  icon?: SCMIcon;
  commitURL?: string;
}

@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    CardAppUptimeComponent,
    MetadataItemComponent,
    ViewBuildpackComponent,
    MbToHumanSizePipe,
    UptimePipe,
  ],
  providers: [
    ApplicationMonitorService,
  ]
})
export class BuildTabComponent implements OnInit {
  applicationService = inject(ApplicationService);
  private scmService = inject(GitSCMService);
  private cups = inject(CurrentUserPermissionsService);

  cardTwoFetching$!: Observable<boolean>;

  public async: any;

  getFullApiUrl = getFullEndpointApiUrl;

  sshStatus$!: Observable<string>;

  deploySource$!: Observable<CustomEnvVarStratosProjectSource>;

  public gitRepo$!: Observable<GitRepo>;
  public gitRepo: GitRepo | null = null;

  ngOnInit() {
    this.cardTwoFetching$ = this.applicationService.application$.pipe(
      combineLatest(
        this.applicationService.appSummary$
      ),
      map(([app, appSummary]: [ApplicationData, EntityInfo<IAppSummary>]) => {
        return app.fetching || appSummary.entityRequestInfo.fetching;
      }), distinct());

    this.sshStatus$ = this.applicationService.application$.pipe(
      combineLatest(this.applicationService.appSpace$),
      map(([app, space]) => {
        if (!space.entity.allow_ssh) {
          return 'Disabled by the space';
        } else {
          return app.app.entity.enable_ssh ? 'Yes' : 'No';
        }
      })
    );

    const canSeeEnvVars$ = this.applicationService.appSpace$.pipe(
      switchMap(space => this.cups.can(
        CfCurrentUserPermissions.APPLICATION_VIEW_ENV_VARS,
        this.applicationService.cfGuid,
        space.metadata.guid)
      )
    );

    this.gitRepo$ = this.applicationService.applicationStratProject$.pipe(
      map(project => {
        const scmType = project.deploySource.scm || project.deploySource.type;
        const scm = this.scmService.getSCM(scmType as GitSCMType, project.deploySource.endpointGuid);
        return gitEntityCatalog.repo.store.getRepoInfo.getEntityService({ projectName: project.deploySource.project, scm });
      }),
      switchMap(repoService => repoService.waitForEntity$),
      map(p => p.entity)
    );

    const deploySource$ = observableCombineLatest(
      this.applicationService.applicationStratProject$,
      this.applicationService.application$
    ).pipe(
      map(([project, app]) => {
        if (project) {
          const deploySource: CustomEnvVarStratosProjectSource = { ...project.deploySource };

          // Legacy
          if (deploySource.type === 'github') {
            deploySource.type = 'gitscm';
            deploySource.scm = 'github';
          }

          if (deploySource.type === DEPLOY_TYPES_IDS.DOCKER_IMG) {
            return {
              type: 'docker',
              dockerImage: app.app.entity.docker_image,
              dockerUrl: this.createDockerImageUrl(deploySource.dockerImage || app.app.entity.docker_image)
            };
          }

          return deploySource;
        } else if (app.app.entity.docker_image) {
          return {
            type: 'docker',
            dockerImage: app.app.entity.docker_image,
            dockerUrl: this.createDockerImageUrl(app.app.entity.docker_image)
          };
        } else {
          return null;
        }
      }),
      switchMap((deploySource: CustomEnvVarStratosProjectSource) => {
        const res: Observable<any>[] = [
          of(deploySource),
        ];
        if (deploySource && deploySource.type === 'gitscm') {
          // Add gitscm info... add async info in next section
          const scmType = deploySource.scm as GitSCMType;
          const scm = this.scmService.getSCM(scmType, deploySource.endpointGuid);
          deploySource.label = scm.getLabel();
          deploySource.icon = scm.getIcon();
          res.push(gitEntityCatalog.commit.store.getEntityService(null, scm.endpointGuid, {
            projectName: deploySource.project,
            scm,
            commitSha: deploySource.commit
          }).entityObs$);
        } else {
          res.push(of(null));
        }
        return observableCombineLatest(res);
      }),
      map(([deploySource, commit]: [CustomEnvVarStratosProjectSource, EntityInfo<GitCommit>]) => {
        if (deploySource) {
          deploySource.commitURL = commit?.entity?.html_url;
        }
        return deploySource;
      }),
      startWith({ type: 'loading', timestamp: null, endpointGuid: null })
    );

    this.deploySource$ = canSeeEnvVars$.pipe(
      switchMap(canSeeEnvVars => canSeeEnvVars ? deploySource$ : of({ type: 'not-available', timestamp: null, endpointGuid: null })),
    );
  }

  private createDockerImageUrl(dockerImage: string): string {
    // https://docs.cloudfoundry.org/devguide/deploy-apps/push-docker.html
    // Private Registry: MY-PRIVATE-REGISTRY.DOMAIN:PORT/REPO/IMAGE:TAG
    // GCP: docker://MY-REGISTRY-URL/MY-PROJECT/MY-IMAGE-NAME
    // DockerHub: REPO/IMAGE:TAG
    isDockerHubRegEx.lastIndex = 0;
    const res = isDockerHubRegEx.exec(dockerImage);
    return res && res.length === 4 ? `https://hub.docker.com/r/${res[1]}/${res[2]}` : null;
  }
}
