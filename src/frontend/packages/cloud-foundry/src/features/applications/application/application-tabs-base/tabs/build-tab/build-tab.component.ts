import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, of } from 'rxjs';
import { combineLatest, delay, distinct, filter, first, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import { AppMetadataTypes } from '../../../../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { UpdateExistingApplication } from '../../../../../../../../cloud-foundry/src/actions/application.actions';
import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ConfirmationDialogConfig } from '../../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { ResetPagination } from '../../../../../../../../store/src/actions/pagination.actions';
import { getFullEndpointApiUrl } from '../../../../../../../../store/src/endpoint-utils';
import { ActionState } from '../../../../../../../../store/src/reducers/api-request-reducer/types';
import { EntityInfo } from '../../../../../../../../store/src/types/api.types';
import { IAppSummary } from '../../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';
import { GitSCMService, GitSCMType } from '../../../../../../shared/data-services/scm/scm.service';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { ApplicationData, ApplicationService } from '../../../../application.service';
import { DEPLOY_TYPES_IDS } from '../../../../deploy-application/deploy-application-steps.types';

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

@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss'],
  providers: [
    ApplicationMonitorService,
  ]
})
export class BuildTabComponent implements OnInit {
  public isBusyUpdating$: Observable<{ updating: boolean }>;
  public manageAppPermission = CfCurrentUserPermissions.APPLICATION_MANAGE;

  constructor(
    public applicationService: ApplicationService,
    private scmService: GitSCMService,
    private store: Store<CFAppState>,
    private route: ActivatedRoute,
    private router: Router,
    private confirmDialog: ConfirmationDialogService,
    private cups: CurrentUserPermissionsService
  ) { }

  cardTwoFetching$: Observable<boolean>;

  public async: any;

  getFullApiUrl = getFullEndpointApiUrl;

  sshStatus$: Observable<string>;

  deploySource$: Observable<{ type: string, [name: string]: any }>;

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
    )

    const deploySource$ = observableCombineLatest(
      this.applicationService.applicationStratProject$,
      this.applicationService.application$
    ).pipe(
      map(([project, app]) => {
        if (!!project) {
          const deploySource = { ...project.deploySource } as any;

          // Legacy
          if (deploySource.type === 'github') {
            deploySource.type = 'gitscm';
            deploySource.scm = 'github';
          }

          if (deploySource.type === 'gitscm') {
            const scmType = deploySource.scm as GitSCMType;
            const scm = this.scmService.getSCM(scmType);
            deploySource.label = scm.getLabel();
            deploySource.commitURL = scm.getCommitURL(deploySource.project, deploySource.commit);
            deploySource.icon = scm.getIcon();
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
      startWith({ type: 'loading' })
    )

    this.deploySource$ = canSeeEnvVars$.pipe(
      switchMap(canSeeEnvVars => canSeeEnvVars ? deploySource$ : of(null)),
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
  }

  restartApplication() {
    this.confirmDialog.open(appRestartConfirmation, () => {

      this.applicationService.application$.pipe(
        first(),
        mergeMap(appData => {
          this.applicationService.updateApplication({ state: 'STOPPED' }, [], appData.app.entity);
          return observableCombineLatest(
            observableOf(appData),
            this.pollEntityService('stopping', 'STOPPED').pipe(first())
          );
        }),
        mergeMap(([appData, updateData]) => {
          this.applicationService.updateApplication({ state: 'STARTED' }, [], appData.app.entity);
          return this.pollEntityService('starting', 'STARTED').pipe(first());
        }),
      ).subscribe({
        error: this.dispatchAppStats,
        complete: this.dispatchAppStats
      });

    });
  }

  private confirmAndPollForState(
    confirmConfig: ConfirmationDialogConfig,
    onConfirm: (appData: ApplicationData) => void,
    updateKey: string,
    requiredAppState: string,
    onSuccess: () => void) {
    this.applicationService.application$.pipe(
      first(),
      tap(appData => {
        this.confirmDialog.open(confirmConfig, () => {
          onConfirm(appData);
          this.pollEntityService(updateKey, requiredAppState).pipe(
            first(),
          ).subscribe(onSuccess);
        });
      })
    ).subscribe();
  }

  private updateApp(confirmConfig: ConfirmationDialogConfig, updateKey: string, requiredAppState: string, onSuccess: () => void) {
    this.confirmAndPollForState(
      confirmConfig,
      appData => this.applicationService.updateApplication({ state: requiredAppState }, [AppMetadataTypes.STATS], appData.app.entity),
      updateKey,
      requiredAppState,
      onSuccess
    );
  }

  stopApplication() {
    this.updateApp(appStopConfirmation, 'stopping', 'STOPPED', () => {
      // On app reaching the 'STOPPED' state clear the app's stats pagination section
      const { cfGuid, appGuid } = this.applicationService;
      const getAppStatsAction = cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid);
      this.store.dispatch(new ResetPagination(getAppStatsAction, getAppStatsAction.paginationKey));
    });
  }

  restageApplication() {
    const { cfGuid, appGuid } = this.applicationService;
    this.confirmAndPollForState(
      appRestageConfirmation,
      () => cfEntityCatalog.application.api.restage(appGuid, cfGuid),
      'starting',
      'STARTED',
      () => { }
    );
  }

  pollEntityService(state, stateString): Observable<any> {
    return this.applicationService.entityService
      .poll(1000, state).pipe(
        delay(1),
        filter(({ resource }) => {
          return resource.entity.state === stateString;
        }),
      );
  }

  startApplication() {
    this.updateApp(appStartConfirmation, 'starting', 'STARTED', () => { });
  }

  redirectToDeletePage() {
    this.router.navigate(['../delete'], { relativeTo: this.route });
  }


}
