import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { GitCommit, gitEntityCatalog, GitRepo, GitSCMService, GitSCMType, SCMIcon } from '@stratosui/git';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, of } from 'rxjs';
import { take, combineLatest, delay, distinct, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import { CFAppState } from '@stratosui/cloud-foundry';
import {
  CurrentUserPermissionsService,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  MetadataItemComponent,
  PageSubNavComponent,
  PageSubNavSectionComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
  MbToHumanSizePipe,
  UptimePipe } from '@stratosui/core';
import { ResetPagination, getFullEndpointApiUrl, ActionState, EntityInfo } from '@stratosui/store';
import { AppMetadataTypes } from '../../../../../../actions/app-metadata.actions';
import { UpdateExistingApplication } from '../../../../../../actions/application.actions';
import { IAppSummary } from '../../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { CfUserPermissionDirective } from '../../../../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { ApplicationData, ApplicationService } from '../../../../application.service';
import { CfAppsSignalConfigService } from '../../../../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { DEPLOY_TYPES_IDS } from '../../../../deploy-application/deploy-application-steps.types';
import { ApplicationPollComponent } from '../../application-poll/application-poll.component';
import { CardAppStatusComponent } from '../../../../../../shared/components/cards/card-app-status/card-app-status.component';
import { CardAppInstancesComponent } from '../../../../../../shared/components/cards/card-app-instances/card-app-instances.component';
import { CardAppUptimeComponent } from '../../../../../../shared/components/cards/card-app-uptime/card-app-uptime.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';
import { EnvVarStratosProjectSource } from './application-env-vars.service';

const isDockerHubRegEx = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)/g;

// Confirmation dialogs
const appStopConfirmation = new ConfirmationDialogConfig(
  'Stop Application',
  'Are you sure you want to stop this Application?',
  'Stop'
);
const appStartConfirmation = new ConfirmationDialogConfig(
  'Start Application',
  'Are you sure you want to start this Application?',
  'Start'
);
const appRestartConfirmation = new ConfirmationDialogConfig(
  'Restart Application',
  'Are you sure you want to restart this Application?',
  'Restart'
);
const appRestageConfirmation = new ConfirmationDialogConfig(
  'Restage Application',
  'Are you sure you want to restage this Application?',
  'Restage'
);

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
    PageSubNavComponent,
    PageSubNavSectionComponent,
    CfUserPermissionDirective,
    ApplicationPollComponent,
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
  private store = inject<Store<CFAppState>>(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmationDialogService);
  private cups = inject(CurrentUserPermissionsService);
  private apps = inject(CfAppsSignalConfigService);

  public isBusyUpdating$!: Observable<{ updating: boolean }>;
  public manageAppPermission = CfCurrentUserPermissions.APPLICATION_MANAGE;

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

    this.isBusyUpdating$ = this.applicationService.entityService.updatingSection$.pipe(
      map(updatingSection => {
        const updating = this.updatingSectionBusy(updatingSection.restaging) ||
          this.updatingSectionBusy(updatingSection[UpdateExistingApplication.updateKey]);
        return { updating };
      }),
      startWith({ updating: true })
    );

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

  private updatingSectionBusy(section: ActionState) {
    return section && section.busy;
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

  // -----------
  // App Actions
  // -----------

  private dispatchAppStats = () => {
    const { cfGuid, appGuid } = this.applicationService;
    cfEntityCatalog.appStats.api.getMultiple(appGuid, cfGuid);
  };

  restartApplication() {
    this.confirmDialog.open(appRestartConfirmation, () => {
      this.runLifecycleAction(() => this.apps.restartApp(
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
      ));
    });
  }

  // Lifecycle actions (start/stop/restart/restage) now flow through the
  // Stratos async-job contract via CfAppsSignalConfigService: writeWithJob
  // hits POST /pp/v1/cf/apps/{cnsi}/{app}/actions/{action} and awaits the
  // CF-side job to terminal state. On resolve we refetch the app entity
  // and stats so the summary reflects the new state.
  //
  // Previously the toolbar dispatched UpdateExistingApplication through
  // NGRX, which PUT'd to the legacy /pp/v1/proxy/v2/apps/{guid} endpoint
  // with {state: "STARTED"|"STOPPED"} and relied on pollEntityService to
  // observe the state flip. That v2 proxy path is retired on the write
  // side as part of the V3 migration.
  private runLifecycleAction(action: () => Promise<void>, onAfter?: () => void): void {
    const { cfGuid, appGuid } = this.applicationService;
    void action()
      .then(() => {
        cfEntityCatalog.application.api.get(appGuid, cfGuid, {});
        this.dispatchAppStats();
        onAfter?.();
      })
      .catch((err: unknown) => {
        console.warn('Lifecycle action failed:', err);
        this.dispatchAppStats();
      });
  }

  stopApplication() {
    this.confirmDialog.open(appStopConfirmation, () => {
      this.runLifecycleAction(
        () => this.apps.stopApp(this.applicationService.cfGuid, this.applicationService.appGuid),
        () => {
          // On app reaching STOPPED, clear the stats pagination section
          // so a re-start comes up with fresh instance rows.
          const { cfGuid, appGuid } = this.applicationService;
          const getAppStatsAction = cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid);
          this.store.dispatch(new ResetPagination(getAppStatsAction, getAppStatsAction.paginationKey));
        },
      );
    });
  }

  startApplication() {
    this.confirmDialog.open(appStartConfirmation, () => {
      this.runLifecycleAction(
        () => this.apps.startApp(this.applicationService.cfGuid, this.applicationService.appGuid),
      );
    });
  }

  restageApplication() {
    this.confirmDialog.open(appRestageConfirmation, () => {
      this.runLifecycleAction(
        () => this.apps.restageApp(this.applicationService.cfGuid, this.applicationService.appGuid),
      );
    });
  }

  redirectToDeletePage() {
    this.router.navigate(['../delete'], { relativeTo: this.route });
  }


}
