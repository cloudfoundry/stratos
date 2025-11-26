import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, NgZone, type OnDestroy, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { GitSCMService, type GitSCMType } from '@stratosui/git';
import { combineLatest as observableCombineLatest, type Observable, type Subscription } from 'rxjs';
import { filter, first, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  EndpointsService,
  getActionsFromExtensions,
  getTabsFromExtensions,
  type StratosActionMetadata,
  StratosActionType,
  StratosTabType,
  CurrentUserPermissionsService,
  safeUnsubscribe,
  type IPageSideNavTab,
  LoadingPageComponent,
  PageHeaderComponent,
  type IHeaderBreadcrumb
} from '@stratosui/core';
import {
  RouterNav,
  entityCatalog,
  type EntitySchema,
  type ActionState,
  endpointEntitiesSelector,
  type APIResource,
  type EndpointModel,
  type IFavoriteMetadata,
  UserFavoriteManager,
  type UserFavorite
} from '@stratosui/store';
import {
  type CFAppState,
  applicationEntityType,
  UpdateExistingApplication,
  type IApp,
  type IOrganization,
  type ISpace,
  CF_ENDPOINT_TYPE,
  ApplicationService,
  CfCurrentUserPermissions,
  type ApplicationStateData
} from '@stratosui/cloud-foundry';
import { ApplicationPollingService } from './application-polling.service';

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss'],
  providers: [ApplicationPollingService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    LoadingPageComponent,
    PageHeaderComponent
  ]
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  public appState$!: Observable<ApplicationStateData>;
  public schema: EntitySchema;
  public favorite$: Observable<UserFavorite<IFavoriteMetadata> | null>;

  isBusyUpdating$!: Observable<{ updating: boolean; }>;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Application);

  constructor(
    public applicationService: ApplicationService,
    private store: Store,
    private endpointsService: EndpointsService,
    _ngZone: NgZone,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    scmService: GitSCMService,
    private userFavoriteManager: UserFavoriteManager,
    private appPollingService: ApplicationPollingService
  ) {
    // Initialize favorite$ after applicationService is available
    this.favorite$ = this.applicationService.app$.pipe(
      filter(app => !!app),
      map(app => this.userFavoriteManager.getFavorite<IFavoriteMetadata>(app.entity, applicationEntityType, CF_ENDPOINT_TYPE))
    );
    const catalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, applicationEntityType);
    this.schema = catalogEntity.getSchema();
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

    const appDoesNotHaveEnvVars$ = this.applicationService.appSpace$.pipe(
      switchMap(space => this.currentUserPermissionsService.can(CfCurrentUserPermissions.APPLICATION_VIEW_ENV_VARS,
        this.applicationService.cfGuid, space.metadata.guid)
      ),
      map(can => !can),
    );

    this.tabLinks = [
      { link: 'summary', label: 'Summary', iconFont: 'stratos-icons', icon: 'application' },
      { link: 'instances', label: 'Instances', iconFont: 'stratos-icons', icon: 'application_instance' },
      { link: 'routes', label: 'Routes', iconFont: 'stratos-icons', icon: 'route' },
      { link: 'log-stream', label: 'Log Stream', icon: 'featured_play_list' },
      { link: 'services', label: 'Services', iconFont: 'stratos-icons', icon: 'service' },
      { link: 'variables', label: 'Variables', icon: 'list', hidden$: appDoesNotHaveEnvVars$ },
      { link: 'events', label: 'Events', icon: 'watch_later' }
    ];

    this.endpointsService.hasMetrics(applicationService.cfGuid).subscribe((hasMetrics: boolean) => {
      if (hasMetrics) {
        this.tabLinks = [
          ...this.tabLinks,
          {
            link: 'metrics',
            label: 'Metrics',
            icon: 'equalizer'
          }
        ];
      }
    });

    // Add any tabs from extensions
    const tabs = getTabsFromExtensions(StratosTabType.Application);
    for (const extensionTab of tabs) {
      this.tabLinks.push(extensionTab);
    }

    // Ensure Git SCM tab gets updated if the app is redeployed from a different SCM Type
    this.stratosProjectSub = this.applicationService.applicationStratProject$
      .subscribe(stratProject => {
        if (
          stratProject?.deploySource &&
          (stratProject.deploySource.type === 'github' || stratProject.deploySource.type === 'gitscm')
        ) {
          const gitscm = stratProject.deploySource.scm || stratProject.deploySource.type;
          const scm = scmService.getSCM(gitscm as GitSCMType, stratProject.deploySource.endpointGuid);
          const iconInfo = scm.getIcon();
          // Add tab or update existing tab
          const tab = this.tabLinks.find(t => t.link === 'gitscm');
          if (!tab) {
            this.tabLinks.push({ link: 'gitscm', label: scm.getLabel(), iconFont: iconInfo.fontName, icon: iconInfo.iconName });
          } else {
            tab.label = scm.getLabel();
            tab.iconFont = iconInfo.fontName;
            tab.icon = iconInfo.iconName;
          }
          this.tabLinks = [...this.tabLinks];
        }
      });
  }

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  isFetching$!: Observable<boolean>;
  applicationActions$!: Observable<string[]>;
  summaryDataChanging$!: Observable<boolean>;
  appSub$!: Subscription;
  stratosProjectSub!: Subscription;

  tabLinks: IPageSideNavTab[];

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

  private updatingSectionBusy(section: ActionState) {
    return section?.busy;
  }

  ngOnInit() {
    this.appSub$ = this.applicationService.entityService.entityMonitor.entityRequest$.subscribe(requestInfo => {
      if (
        requestInfo.deleting.deleted ||
        requestInfo.error
      ) {
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });

    this.isFetching$ = this.applicationService.isFetchingApp$;

    this.isBusyUpdating$ = this.applicationService.entityService.updatingSection$.pipe(
      map(updatingSection => {
        const updating = this.updatingSectionBusy(updatingSection.restaging) ||
          this.updatingSectionBusy(updatingSection[UpdateExistingApplication.updateKey]);
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
      this.appPollingService.isPolling$
    ).pipe(map(([isFetchingApp, isUpdating, isPolling]) => {
      if (isPolling) {
        return false;
      }
      return !!(isFetchingApp || isUpdating);
    }));
  }

  ngOnDestroy() {
    safeUnsubscribe(this.appSub$, this.stratosProjectSub);
    this.appPollingService.stop();
  }
}
