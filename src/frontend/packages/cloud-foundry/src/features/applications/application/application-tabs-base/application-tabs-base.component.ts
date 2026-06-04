import { CommonModule } from '@angular/common';
import { Component, EffectRef, Injector, NgZone, OnDestroy, OnInit, ChangeDetectionStrategy, effect, inject, runInInjectionContext } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@stratosui/store';
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
  EndpointModel,
  IFavoriteMetadata,
  UserFavoriteManager
} from '@stratosui/store';
import {
  CFAppState,
  applicationEntityType,
  IApp,
  CF_ENDPOINT_TYPE,
  ApplicationService,
  CfCurrentUserPermissions,
  ApplicationStateData
} from '@stratosui/cloud-foundry';
import { CfEndpointsDataService } from '../../../../services/domain-data/cf-endpoints-data.service';
import { StOrg, StSpace } from '../../../../services/endpoint-data/stratos-types';
import { AppApplicationActionBarComponent } from '../../../../shared/components/application-action-bar/application-action-bar.component';
import { AppApplicationActionsService } from '../../../../shared/services/application-actions.service';
import { AppLifecycleProgressService } from '../../../../shared/components/app-lifecycle-progress/app-lifecycle-progress.service';
import { AppDetailDataService } from '../../app-detail-data.service';

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss'],
  // AppApplicationActionsService and AppLifecycleProgressService are
  // provided at application-base.component (the parent) — see comments
  // there. They must live above AppDetailDataService in the injector tree
  // because the data service injects the action service for poll-cadence
  // gating; a child-scoped provider would be invisible to it (NG0201).
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
  private router = inject(Router);
  private endpointsService = inject(EndpointsService);
  private ngZone = inject(NgZone);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private cfEndpoints = inject(CfEndpointsDataService);
  private lifecycleProgress = inject(AppLifecycleProgressService);
  private detail = inject(AppDetailDataService);
  private injector = inject(Injector);
  private errorRedirectEffect?: EffectRef;
  public appState$!: Observable<ApplicationStateData>;
  public favorite$: Observable<any>;

  isBusyUpdating$!: Observable<{ updating: boolean; }>;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Application);

  constructor() {
    const applicationService = this.applicationService;
    const store = this.store;
    const scmService = inject(GitSCMService);

    // Initialize favorite$ after applicationService is available
    // Filter for fully-hydrated entity with cfGuid stamped — getFavorite
    // resolves the endpoint id via cf-entity-generator's getEndpointIdFromEntity
    // (entity.entity.cfGuid). Loose !!app emissions slip through with empty
    // inner entity and trigger "endpointId is undefined" warnings on every
    // ngrx state churn (4 on initial load, 14+ during a lifecycle action).
    this.favorite$ = this.applicationService.app$.pipe(
      filter(info => !!info?.entity?.entity?.cfGuid),
      map(info => this.userFavoriteManager.getFavorite<IFavoriteMetadata>(info.entity, applicationEntityType, CF_ENDPOINT_TYPE))
    );
    const endpoints$ = toObservable(this.cfEndpoints.all);
    this.breadcrumbs$ = applicationService.waitForAppEntity$.pipe(
      withLatestFrom(
        endpoints$,
        applicationService.appOrg$,
        applicationService.appSpace$
      ),
      // Skip emissions where the endpoint entry, org, or space hasn't loaded
      // yet — getBreadcrumbs reads .name off each and throws on undefined.
      // Without this guard, ngrx state churn during refreshes (or a slow
      // endpoint reducer hydrating after waitForAppEntity$ already replayed)
      // produces console TypeErrors on every navigation.
      filter(([app, endpoints, org, space]) =>
        !!endpoints?.[app.entity.entity.cfGuid] && !!org && !!space
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
        this.applicationService.cfGuid, space.guid)
      ),
      map(can => !can),
    );

    this.tabLinks = [
      { link: 'summary', label: 'Summary', iconFont: 'stratos-icons', icon: 'application' },
      { link: 'instances', label: 'Instances', iconFont: 'stratos-icons', icon: 'application_instance' },
      { link: 'log-stream', label: 'Log Stream', icon: 'featured_play_list' },
      { link: 'revisions', label: 'Revisions', icon: 'history' },
      { link: 'routes', label: 'Routes', iconFont: 'stratos-icons', icon: 'route' },
      { link: 'variables', label: 'Variables', icon: 'list', hidden$: appDoesNotHaveEnvVars$ },
      { link: 'services', label: 'Services', iconFont: 'stratos-icons', icon: 'service' },
      { link: 'events', label: 'Events', icon: 'watch_later' },
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
  stratosProjectSub!: Subscription;

  tabLinks: IPageSideNavTab[];

  private getBreadcrumbs(
    application: IApp,
    endpoint: EndpointModel,
    org: StOrg,
    space: StSpace
  ) {
    const baseCFUrl = `/cloud-foundry/${application.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.guid}`;

    const baseSpaceBreadcrumbs = [
      { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
      { value: org.name, routerLink: `${baseOrgUrl}/spaces` }
    ];

    return [
      {
        breadcrumbs: [{ value: 'Applications', routerLink: '/applications' }]
      },
      {
        // CF-scoped Applications breadcrumb: emitted when the row link
        // on the per-CF applications wall (CloudFoundryApplicationsSignal)
        // passes ?breadcrumbs=cf. Sends the user back to the scoped wall
        // they came from instead of the global one.
        key: 'cf',
        breadcrumbs: [{ value: 'Applications', routerLink: `${baseCFUrl}/applications` }]
      },
      {
        key: 'space',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.name, routerLink: `${baseOrgUrl}/spaces/${space.guid}/apps` }
        ]
      },
      {
        key: 'space-services',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.name, routerLink: `${baseOrgUrl}/spaces/${space.guid}/service-instances` }
        ]
      },
      {
        key: 'space-user-services',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.name, routerLink: `${baseOrgUrl}/spaces/${space.guid}/user-service-instances` }
        ]
      },
      {
        key: 'space-routes',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.name, routerLink: `${baseOrgUrl}/spaces/${space.guid}/routes` }
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
          { value: space.name, routerLink: `${baseOrgUrl}/spaces/${space.guid}/summary` }
        ]
      },
      {
        key: 'org',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.name, routerLink: `${baseOrgUrl}/summary` },
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

  ngOnInit() {
    // Activate the lifecycle-progress overlay service. The service needs an
    // injection context for its effect(), which is why activation is deferred
    // to ngOnInit rather than happening in the constructor.
    this.lifecycleProgress.initialize();

    // Navigate away if the app fetch errors out (deleted from another tab,
    // permission revoked, 404 on direct URL after backend restart, etc.).
    // The legacy ngrx path also handled the post-delete redirect, but the
    // delete flow now owns its own nav (AppApplicationActionsService.
    // deleteWithCleanup → router.navigate('/applications')).
    runInInjectionContext(this.injector, () => {
      this.errorRedirectEffect = effect(() => {
        if (this.detail.errors().app) {
          this.router.navigate(['applications']);
        }
      });
    });

    // The full-page "Retrieving application" overlay is for the INITIAL load
    // only. Lifecycle actions (restage/start/stop/restart) refresh the app
    // entity on success, which flips isFetchingApp$ true again — but the app
    // is already on screen and the Status card (stage-row progress) + the
    // snackbar convey the action's progress/result in place. Gating on "app
    // not yet present" stops those refreshes from blanking the whole page with
    // the spinner (the restage repaint regression).
    this.isFetching$ = observableCombineLatest(
      this.applicationService.isFetchingApp$,
      toObservable(this.detail.app, { injector: this.injector }),
    ).pipe(
      map(([isFetchingApp, app]) => isFetchingApp && !app),
    );

    this.isBusyUpdating$ = toObservable(this.detail.updating, { injector: this.injector }).pipe(
      map(updating => ({ updating })),
      startWith({ updating: true }),
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
    ).pipe(map(([isFetchingApp, isUpdating]) => {
      return !!(isFetchingApp || isUpdating);
    }));
  }

  // Loading-overlay text reflects the active tab — e.g. "Retrieving Events" on
  // the Events tab — instead of always "Retrieving application". Falls back to
  // the app text for the base route / unknown tabs.
  loadingText(): string {
    const last = this.router.url.split('?')[0].split('/').filter(Boolean).pop();
    const tab = (this.tabLinks ?? []).find(t => t.link === last);
    return tab ? `Retrieving ${tab.label}` : 'Retrieving application';
  }

  ngOnDestroy() {
    this.lifecycleProgress.destroy();
    this.errorRedirectEffect?.destroy();
    safeUnsubscribe(this.stratosProjectSub);
  }
}
