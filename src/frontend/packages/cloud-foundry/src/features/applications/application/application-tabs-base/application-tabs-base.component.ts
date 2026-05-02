import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { GitSCMService, GitSCMType } from '@stratosui/git';
import { combineLatest as observableCombineLatest, Observable, Subscription } from 'rxjs';
import { take, filter, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  EndpointsService,
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
  CurrentUserPermissionsService,
  safeUnsubscribe,
  IPageSideNavTab,
  LoadingPageComponent,
  PageHeaderComponent,
  IHeaderBreadcrumb
} from '@stratosui/core';
import {
  RouterNav,
  entityCatalog,
  EntitySchema,
  ActionState,
  endpointEntitiesSelector,
  APIResource,
  EndpointModel,
  IFavoriteMetadata,
  UserFavoriteManager
} from '@stratosui/store';
import {
  CFAppState,
  applicationEntityType,
  UpdateExistingApplication,
  IApp,
  IOrganization,
  ISpace,
  CF_ENDPOINT_TYPE,
  ApplicationService,
  CfCurrentUserPermissions,
  ApplicationStateData
} from '@stratosui/cloud-foundry';
import { ApplicationPollingService } from './application-polling.service';
import { AppApplicationActionBarComponent } from '../../../../shared/components/application-action-bar/application-action-bar.component';
import { AppApplicationActionsService } from '../../../../shared/services/application-actions.service';

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss'],
  // AppApplicationActionsService is provided here (rather than on the action
  // bar component) so the BuildTab status card can read its inFlight signal
  // for the in-flight pulse animation. The action bar consumes the same
  // instance as a sibling consumer.
  providers: [ApplicationPollingService, AppApplicationActionsService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    LoadingPageComponent,
    PageHeaderComponent,
    AppApplicationActionBarComponent
  ]
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  applicationService = inject(ApplicationService);
  private store = inject<Store<CFAppState>>(Store);
  private endpointsService = inject(EndpointsService);
  private ngZone = inject(NgZone);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private appPollingService = inject(ApplicationPollingService);

  public appState$!: Observable<ApplicationStateData>;
  public schema: EntitySchema;
  public favorite$: Observable<any>;

  isBusyUpdating$!: Observable<{ updating: boolean; }>;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Application);

  constructor() {
    const applicationService = this.applicationService;
    const store = this.store;
    const scmService = inject(GitSCMService);

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
      take(1)
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
      { link: 'events', label: 'Events', icon: 'watch_later' },
      { link: 'revisions', label: 'Revisions', icon: 'history' },
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
    tabs.map((extensionTab) => {
      this.tabLinks.push(extensionTab);
    });

    // Ensure Git SCM tab gets updated if the app is redeployed from a different SCM Type
    this.stratosProjectSub = this.applicationService.applicationStratProject$
      .subscribe(stratProject => {
        if (
          stratProject &&
          stratProject.deploySource &&
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
    return section && section.busy;
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
