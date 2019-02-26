import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { delay, filter, first, map, mergeMap, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import {
  AppMetadataTypes,
  GetAppStatsAction,
  GetAppSummaryAction,
} from '../../../../../../store/src/actions/app-metadata.actions';
import { RestageApplication } from '../../../../../../store/src/actions/application.actions';
import { ResetPagination } from '../../../../../../store/src/actions/pagination.actions';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { applicationSchemaKey, appStatsSchemaKey, entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { endpointEntitiesSelector } from '../../../../../../store/src/selectors/endpoint.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { UserFavorite } from '../../../../../../store/src/types/user-favorites.types';
import { IAppFavMetadata } from '../../../../cf-favourite-types';
import { IApp, IOrganization, ISpace } from '../../../../core/cf-api.types';
import { CurrentUserPermissions } from '../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../core/current-user-permissions.service';
import { EntityService } from '../../../../core/entity-service';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../core/extension/extension-service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { ApplicationStateData } from '../../../../shared/components/application-state/application-state.service';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { IHeaderBreadcrumb } from '../../../../shared/components/page-header/page-header.types';
import { ISubHeaderTabs } from '../../../../shared/components/page-subheader/page-subheader.types';
import { GitSCMService, GitSCMType } from '../../../../shared/data-services/scm/scm.service';
import { ENTITY_SERVICE } from '../../../../shared/entity.tokens';
import { ApplicationData, ApplicationService } from '../../application.service';
import { EndpointsService } from './../../../../core/endpoints.service';

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
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss']
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  public schema = entityFactory(applicationSchemaKey);
  public manageAppPermission = CurrentUserPermissions.APPLICATION_MANAGE;
  public appState$: Observable<ApplicationStateData>;

  public favorite$ = this.applicationService.app$.pipe(
    filter(app => !!app),
    map(app => new UserFavorite<IAppFavMetadata, APIResource<IApp>>(
      this.applicationService.cfGuid,
      'cf',
      applicationSchemaKey,
      this.applicationService.appGuid,
      app.entity
    ))
  );

  isBusyUpdating$: Observable<{ updating: boolean }>;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Application);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public applicationService: ApplicationService,
    @Inject(ENTITY_SERVICE) private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private endpointsService: EndpointsService,
    private ngZone: NgZone,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    scmService: GitSCMService
  ) {
    const appDoesNotHaveEnvVars$ = this.applicationService.appSpace$.pipe(
      switchMap(space => this.currentUserPermissionsService.can(CurrentUserPermissions.APPLICATION_VIEW_ENV_VARS,
        this.applicationService.cfGuid, space.metadata.guid)
      ),
      map(can => !can)
    );
    this.tabLinks = [
      { link: 'summary', label: 'Summary' },
      { link: 'instances', label: 'Instances' },
      { link: 'routes', label: 'Routes' },
      { link: 'log-stream', label: 'Log Stream' },
      { link: 'services', label: 'Services' },
      { link: 'variables', label: 'Variables', hidden: appDoesNotHaveEnvVars$ },
      { link: 'events', label: 'Events' }
    ];

    const endpoints$ = store.select(endpointEntitiesSelector);
    this.breadcrumbs$ = applicationService.waitForAppEntity$.pipe(
      withLatestFrom(
        endpoints$,
        applicationService.appOrg$,
        applicationService.appSpace$
      ),
      map(([app, endpoints, org, space]) => {
        return this.getBreadcrumbs(
          app.entity.entity,
          endpoints[app.entity.entity.cfGuid],
          org,
          space
        );
      }),
      first()
    );
    this.applicationService.applicationStratProject$
      .pipe(first())
      .subscribe(stratProject => {
        if (
          stratProject &&
          stratProject.deploySource &&
          stratProject.deploySource.type === 'github'
        ) {
          this.tabLinks.push({ link: 'github', label: 'GitHub' });
        }
      });
    this.endpointsService.hasMetrics(applicationService.cfGuid).subscribe(hasMetrics => {
      if (hasMetrics) {
        this.tabLinks.push({
          link: 'metrics',
          label: 'Metrics'
        });
      }
    });
    this.applicationService.waitForAppAutoscalerHealth$
      .pipe(first())
      .subscribe(entity => {
        if (entity && entity.entity && entity.entity.entity && entity.entity.entity.uptime > 0) {
          this.tabLinks.push({ link: 'auto-scaler', label: 'Autoscale' });
        }
      });

    this.endpointsService.hasMetrics(applicationService.cfGuid).subscribe(hasMetrics => {
      if (hasMetrics) {
        this.tabLinks.push({
          link: 'metrics',
          label: 'Metrics'
        });
      }
    });

    // Add any tabs from extensions
    this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.Application));

    // Ensure Git SCM tab gets updated if the app is redeployed from a different SCM Type
    this.stratosProjectSub = this.applicationService.applicationStratProject$
      .subscribe(stratProject => {
        if (
          stratProject &&
          stratProject.deploySource &&
          (stratProject.deploySource.type === 'github' || stratProject.deploySource.type === 'gitscm')
        ) {
          const gitscm = stratProject.deploySource.scm || stratProject.deploySource.type;
          const scm = scmService.getSCM(gitscm as GitSCMType);

          // Add tab or update existing tab
          const tab = this.tabLinks.find(t => t.link === 'gitscm');
          if (!tab) {
            this.tabLinks.push({ link: 'gitscm', label: scm.getLabel() });
          } else {
            tab.label = scm.getLabel();
          }
        }
      });
  }

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  isFetching$: Observable<boolean>;
  applicationActions$: Observable<string[]>;
  summaryDataChanging$: Observable<boolean>;
  appSub$: Subscription;
  entityServiceAppRefresh$: Subscription;
  stratosProjectSub: Subscription;
  autoRefreshString = 'auto-refresh';

  autoRefreshing$ = this.entityService.updatingSection$.pipe(map(
    update => update[this.autoRefreshString] || { busy: false }
  ));

  tabLinks: ISubHeaderTabs[];

  private getBreadcrumbs(
    application: IApp,
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
    space: APIResource<ISpace>
  ) {
    const baseCFUrl = `/cloud-foundry/${application.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.metadata.guid}`;

    const baseSpaceBreadcrumbs = [
      { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
      { value: org.entity.name, routerLink: `${baseOrgUrl}/spaces` }
    ];

    return [
      {
        breadcrumbs: [{ value: 'Applications', routerLink: '/applications' }]
      },
      {
        key: 'space',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/apps` }
        ]
      },
      {
        key: 'space-services',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/service-instances` }
        ]
      },
      {
        key: 'space-user-services',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/user-service-instances` }
        ]
      },
      {
        key: 'space-routes',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/routes` }
        ]
      },
      {
        key: 'marketplace-services',
        breadcrumbs: [
          { value: 'Marketplace', routerLink: `/marketplace` }
        ]
      },
      {
        key: 'service-wall',
        breadcrumbs: [
          { value: 'Services', routerLink: `/services` }
        ]
      },
      {
        key: 'space-summary',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/summary` }
        ]
      },
      {
        key: 'org',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.entity.name, routerLink: `${baseOrgUrl}/summary` },
        ]
      },
      {
        key: 'cf',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/summary` }
        ]
      }
    ];
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
      this.store.dispatch(new ResetPagination(appStatsSchemaKey, new GetAppStatsAction(appGuid, cfGuid).paginationKey));
    });
  }

  restageApplication() {
    const { cfGuid, appGuid } = this.applicationService;
    this.confirmAndPollForState(
      appRestageConfirmation,
      () => this.store.dispatch(new RestageApplication(appGuid, cfGuid)),
      'starting',
      'STARTED',
      () => { }
    );
  }

  pollEntityService(state, stateString): Observable<any> {
    return this.entityService
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

  private dispatchAppStats = () => {
    const { cfGuid, appGuid } = this.applicationService;
    this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
  }

  private updatingSectionBusy(section: ActionState) {
    return section && section.busy;
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

  redirectToDeletePage() {
    this.router.navigate(['./delete'], { relativeTo: this.route });
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    // Auto refresh
    this.ngZone.runOutsideAngular(() => {
      this.entityServiceAppRefresh$ = this.entityService
        .poll(10000, this.autoRefreshString).pipe(
          tap(({ resource }) => {
            this.ngZone.run(() => {
              this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
              if (resource && resource.entity && resource.entity.state === 'STARTED') {
                this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
              }
            });
          }))
        .subscribe();
    });

    this.appSub$ = this.entityService.entityMonitor.entityRequest$.subscribe(requestInfo => {
      if (
        requestInfo.deleting.deleted ||
        requestInfo.error
      ) {
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });

    this.isFetching$ = this.applicationService.isFetchingApp$;

    this.isBusyUpdating$ = this.entityService.updatingSection$.pipe(
      map(updatingSection => {
        const updating = this.updatingSectionBusy(updatingSection.restaging) ||
          this.updatingSectionBusy(updatingSection['Updating-Existing-Application']);
        return { updating };
      }),
      startWith({ updating: true })
    );

    const initialFetch$ = observableCombineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$
    ).pipe(
      map(([isFetchingApp, isFetchingEnvVars, isFetchingStats]) => {
        return isFetchingApp || isFetchingEnvVars || isFetchingStats;
      }));

    this.summaryDataChanging$ = observableCombineLatest(
      initialFetch$,
      this.applicationService.isUpdatingApp$,
      this.autoRefreshing$
    ).pipe(map(([isFetchingApp, isUpdating, autoRefresh]) => {
      if (autoRefresh.busy) {
        return false;
      }
      return !!(isFetchingApp || isUpdating);
    }));
  }

  ngOnDestroy() {
    safeUnsubscribe(this.appSub$, this.entityServiceAppRefresh$, this.stratosProjectSub);
  }
}
