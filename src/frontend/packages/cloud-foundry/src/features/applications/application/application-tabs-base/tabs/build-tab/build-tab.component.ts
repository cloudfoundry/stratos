import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GitCommit, GitDataService, GitResourceState, GitRepo, GitSCMService, GitSCMType, SCMIcon } from '@stratosui/git';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest as observableCombineLatest, EMPTY, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  MetadataItemComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
  MbToHumanSizePipe,
  UptimePipe } from '@stratosui/core';
import { getFullEndpointApiUrl } from '@stratosui/store';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { ApplicationService } from '../../../../application.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { CfEndpointsDataService } from '../../../../../../services/domain-data/cf-endpoints-data.service';
import { AppApplicationActionsService } from '../../../../../../shared/services/application-actions.service';
import { DEPLOY_TYPES_IDS } from '../../../../deploy-application/deploy-application-steps.types';
import { CardAppStatusComponent } from '../../../../../../shared/components/cards/card-app-status/card-app-status.component';
import { CardAppInstancesComponent } from '../../../../../../shared/components/cards/card-app-instances/card-app-instances.component';
import { CardAppUptimeComponent } from '../../../../../../shared/components/cards/card-app-uptime/card-app-uptime.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';
import { InstancesAccordionComponent } from './instances-accordion/instances-accordion.component';
import { EnvVarStratosProject, EnvVarStratosProjectSource } from './application-env-vars.service';

const isDockerHubRegEx = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)/g;

// What a git lookup is made from: the host (SCM type and endpoint), the
// project and the commit. App and env var refreshes hand over equal sources
// again; comparing on this keeps a failed lookup from being retried on each.
const gitSourceKey = (source: EnvVarStratosProjectSource): string =>
  [source.scm || source.type, source.endpointGuid, source.project, source.commit].join('|');

interface CustomEnvVarStratosProjectSource extends EnvVarStratosProjectSource {
  label?: string;
  icon?: SCMIcon;
  commitURL?: string;
}

// The view-model the Build tab's deploy-source pipeline actually emits: a
// git/docker deploy source, the docker-image variant, or one of the
// 'loading' / 'not-available' sentinels. All fields the template reads are
// optional because each variant populates a different subset.
interface DeploySourceView {
  type: string;
  scm?: string;
  project?: string;
  branch?: string;
  commit?: string;
  url?: string;
  endpointGuid?: string;
  timestamp?: number | null;
  label?: string;
  icon?: SCMIcon;
  commitURL?: string;
  dockerImage?: string;
  dockerUrl?: string | null;
}

@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
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
    InstancesAccordionComponent,
    MbToHumanSizePipe,
    UptimePipe,
  ],
})
export class BuildTabComponent implements OnInit {
  applicationService = inject(ApplicationService);
  data = inject(AppDetailDataService);
  private cfEndpoints = inject(CfEndpointsDataService);
  private injector = inject(Injector);
  // The endpoint's name once the endpoints are known, else its id.
  readonly endpointName = computed(() => this.cfEndpoints.all()?.[this.applicationService.cfGuid]?.name || this.applicationService.cfGuid);
  // Read inFlight signal from the action service so the status card pulses
  // while a lifecycle action is in progress — visual feedback right where
  // the operator is looking, in addition to the bottom-of-page snackbar.
  actions = inject(AppApplicationActionsService);
  private scmService = inject(GitSCMService);
  private gitData = inject(GitDataService);
  private cups = inject(CurrentUserPermissionsService);

  getFullApiUrl = getFullEndpointApiUrl;

  readonly sshStatus = computed(() => {
    const app = this.data.app();
    if (!app) {
      return '';
    }
    if (!this.data.space()?.allowSsh) {
      return 'Disabled by the space';
    }
    return app.entity.enable_ssh ? 'Yes' : 'No';
  });

  // The git lookups are streams, so the app and the project are bridged
  // for them. The project is null until env vars
  // load and STRATOS_PROJECT is parsed, and never emits as null, so the
  // deploy source stays 'loading' until then.
  private readonly app$ = toObservable(this.data.app).pipe(filter(app => !!app));
  private readonly stratosProject$ = toObservable(this.data.stratosProject).pipe(
    filter((project): project is EnvVarStratosProject => project != null),
  );

  // Built once per space; null until the space is known.
  private readonly envVarsCheck = computed(() => {
    const spaceGuid = this.data.space()?.guid;
    return spaceGuid ? this.cups.can(CfCurrentUserPermissions.APPLICATION_VIEW_ENV_VARS,
      this.applicationService.cfGuid, spaceGuid) : null;
  });
  private readonly canSeeEnvVars = computed(() => this.envVarsCheck()?.() ?? null);

  deploySource$!: Observable<DeploySourceView | null>;

  public gitRepo$!: Observable<GitRepo>;
  public gitRepo: GitRepo | null = null;

  ngOnInit() {
    // Trigger the service-bindings fetch so the Summary card's Services
    // count signal is populated when the Build tab loads — without
    // requiring the user to visit the Services tab first to kick off
    // the load.
    void this.data.refresh('serviceBindings');

    // The git lookups below are requests, so the permission is bridged.
    const canSeeEnvVars$ = toObservable(this.canSeeEnvVars, { injector: this.injector }).pipe(
      filter((can): can is boolean => can !== null),
      distinctUntilChanged(),
    );

    this.gitRepo$ = this.stratosProject$.pipe(
      distinctUntilChanged((a, b) => gitSourceKey(a.deploySource) === gitSourceKey(b.deploySource)),
      map(project => {
        const scmType = project.deploySource.scm || project.deploySource.type;
        const scm = this.scmService.getSCM(scmType as GitSCMType, project.deploySource.endpointGuid);
        // strict: applicationStratProject$ only carries a git deploySource here,
        // whose project name is always populated (optional on the shared source
        // type because docker/other deploy kinds omit it).
        return this.gitData.getRepository(scm, project.deploySource.project!);
      }),
      // A failed lookup leaves the repository links out instead of throwing
      // into the template's async pipes.
      switchMap(repoResource => repoResource.waitForValue$.pipe(catchError(() => EMPTY)))
    );

    const deploySource$ = observableCombineLatest([
      this.stratosProject$,
      this.app$,
    ]).pipe(
      map(([project, app]): DeploySourceView | null => {
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
              dockerImage: app!.entity.docker_image,
              dockerUrl: this.createDockerImageUrl(deploySource.dockerImage || app!.entity.docker_image)
            };
          }

          return deploySource;
        } else if (app!.entity.docker_image) {
          return {
            type: 'docker',
            dockerImage: app!.entity.docker_image,
            dockerUrl: this.createDockerImageUrl(app!.entity.docker_image)
          };
        } else {
          return null;
        }
      }),
      // Each app refresh rebuilds an equal source; only a changed one is shown
      // and looked up again. The steps below fill in a copy, so the source
      // kept for this comparison stays as built.
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap((source: DeploySourceView | null) => {
        const deploySource = source && { ...source };
        let commit$: Observable<GitResourceState<GitCommit> | null> = of(null);
        if (deploySource && deploySource.type === 'gitscm') {
          // Add gitscm info... add async info in next section
          const scmType = deploySource.scm as GitSCMType;
          // strict: a gitscm deploy source always carries endpointGuid/project/commit.
          const scm = this.scmService.getSCM(scmType, deploySource.endpointGuid!);
          deploySource.label = scm.getLabel();
          deploySource.icon = scm.getIcon();
          commit$ = this.gitData.getCommit(scm, deploySource.project!, deploySource.commit!).state$;
        }
        return observableCombineLatest([of(deploySource), commit$]);
      }),
      map(([deploySource, commit]: [DeploySourceView | null, GitResourceState<GitCommit> | null]) => {
        if (deploySource) {
          deploySource.commitURL = commit?.value?.html_url;
        }
        return deploySource;
      }),
      startWith({ type: 'loading', timestamp: null } as DeploySourceView)
    );

    this.deploySource$ = canSeeEnvVars$.pipe(
      switchMap(canSeeEnvVars => canSeeEnvVars ? deploySource$ : of({ type: 'not-available', timestamp: null } as DeploySourceView)),
    );
  }

  private createDockerImageUrl(dockerImage: string | undefined): string | null {
    // https://docs.cloudfoundry.org/devguide/deploy-apps/push-docker.html
    // Private Registry: MY-PRIVATE-REGISTRY.DOMAIN:PORT/REPO/IMAGE:TAG
    // GCP: docker://MY-REGISTRY-URL/MY-PROJECT/MY-IMAGE-NAME
    // DockerHub: REPO/IMAGE:TAG
    if (!dockerImage) {
      return null;
    }
    isDockerHubRegEx.lastIndex = 0;
    const res = isDockerHubRegEx.exec(dockerImage);
    return res && res.length === 4 ? `https://hub.docker.com/r/${res[1]}/${res[2]}` : null;
  }
}
