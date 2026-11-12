import { Component, EffectRef, Injector, OnDestroy, OnInit, ChangeDetectionStrategy, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { GitSCMService, GitSCMType } from '@stratosui/git';

import {
  EndpointsService,
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
  CurrentUserPermissionsService,
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
  applicationEntityType,
  IApp,
  CF_ENDPOINT_TYPE,
  ApplicationService,
  CfCurrentUserPermissions,
} from '@stratosui/cloud-foundry';
import { CfEndpointsDataService } from '../../../../services/domain-data/cf-endpoints-data.service';
import { StOrg, StSpace } from '../../../../services/endpoint-data/stratos-types';
import { AppApplicationActionBarComponent } from '../../../../shared/components/application-action-bar/application-action-bar.component';
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
    RouterModule,
    LoadingPageComponent,
    PageHeaderComponent,
    AppApplicationActionBarComponent
  ]
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  applicationService = inject(ApplicationService);
  private router = inject(Router);
  private endpointsService = inject(EndpointsService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private cfEndpoints = inject(CfEndpointsDataService);
  private lifecycleProgress = inject(AppLifecycleProgressService);
  readonly detail = inject(AppDetailDataService);
  private injector = inject(Injector);
  private errorRedirectEffect?: EffectRef;

  // The endpoint id comes from the PAGE context (applicationService.cfGuid),
  // NOT the row's stamped cfGuid: rows can be mis-stamped when Stratos
  // endpoints share one CAPI, which would render the star on the wrong
  // endpoint (the cross-endpoint favourite leak). getFavoriteFromEntity
  // takes the id explicitly. Null until the entity is fully hydrated.
  readonly favorite = computed(() => {
    const app = this.detail.app();
    return app?.entity?.cfGuid
      ? this.userFavoriteManager.getFavoriteFromEntity<IFavoriteMetadata>(
        applicationEntityType, CF_ENDPOINT_TYPE, this.applicationService.cfGuid, app)
      : null;
  });

  // Null until the endpoint entry, org and space have all loaded:
  // getBreadcrumbs reads .name off each.
  readonly breadcrumbs = computed((): IHeaderBreadcrumb[] | null => {
    const app = this.detail.app()?.entity;
    const endpoint = app?.cfGuid ? this.cfEndpoints.all()?.[app.cfGuid] : undefined;
    const org = this.detail.org();
    const space = this.detail.space();
    return app && endpoint && org && space ? this.getBreadcrumbs(app, endpoint, org, space) : null;
  });

  // The full-page "Retrieving application" overlay is for the INITIAL load
  // only. Lifecycle actions (restage/start/stop/restart) refresh the app
  // entity on success, which flips the loading flag true again — but the app
  // is already on screen and the Status card (stage-row progress) + the
  // snackbar convey the action's progress/result in place. Gating on "app
  // not yet present" stops those refreshes from blanking the whole page with
  // the spinner (the restage repaint regression).
  readonly isFetching = computed(() => this.detail.loading().app && !this.detail.app());

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Application);

  constructor() {
    const applicationService = this.applicationService;
    const scmService = inject(GitSCMService);

    // Built once per space; null until the space is known.
    const envVarsCheck = computed(() => {
      const spaceGuid = this.detail.space()?.guid;
      return spaceGuid ? this.currentUserPermissionsService.can(CfCurrentUserPermissions.APPLICATION_VIEW_ENV_VARS,
        this.applicationService.cfGuid, spaceGuid) : null;
    });
    const appDoesNotHaveEnvVars = computed(() => {
      const check = envVarsCheck();
      return check ? !check() : null;
    });

    this.tabLinks.set([
      { link: 'summary', label: 'Summary', iconFont: 'stratos-icons', icon: 'application' },
      { link: 'log-stream', label: 'Log Stream', icon: 'featured_play_list' },
      { link: 'revisions', label: 'Revisions', icon: 'history' },
      { link: 'routes', label: 'Routes', iconFont: 'stratos-icons', icon: 'route' },
      { link: 'variables', label: 'Variables', icon: 'list', isHidden: appDoesNotHaveEnvVars },
      { link: 'services', label: 'Services', iconFont: 'stratos-icons', icon: 'service' },
      { link: 'events', label: 'Events', icon: 'watch_later' },
    ]);

    this.endpointsService.hasMetrics(applicationService.cfGuid).subscribe((hasMetrics: boolean) => {
      if (hasMetrics) {
        this.tabLinks.update(tabs => [
          ...tabs,
          {
            link: 'metrics',
            label: 'Metrics',
            icon: 'equalizer'
          }
        ]);
      }
    });

    // Add any tabs from extensions
    const tabs = getTabsFromExtensions(StratosTabType.Application);
    tabs.map((extensionTab) => {
      this.tabLinks.update(tabs => [...tabs, extensionTab]);
    });

    // Ensure Git SCM tab gets updated if the app is redeployed from a different SCM Type
    effect(() => {
      const stratProject = this.detail.stratosProject();
      if (
        stratProject &&
        stratProject.deploySource &&
        (stratProject.deploySource.type === 'github' || stratProject.deploySource.type === 'gitscm')
      ) {
        const gitscm = stratProject.deploySource.scm || stratProject.deploySource.type;
        const scm = scmService.getSCM(gitscm as GitSCMType, stratProject.deploySource.endpointGuid);
        const iconInfo = scm.getIcon();
        // Add tab or update existing tab
        const tab = this.tabLinks().find(t => t.link === 'gitscm');
        if (!tab) {
          this.tabLinks.update(tabs => [...tabs, { link: 'gitscm', label: scm.getLabel(), iconFont: iconInfo.fontName, icon: iconInfo.iconName }]);
        } else {
          tab.label = scm.getLabel();
          tab.iconFont = iconInfo.fontName;
          tab.icon = iconInfo.iconName;
        }
        this.tabLinks.update(tabs => [...tabs]);
      }
    });
  }

  // Signal: written after the first render; an OnPush view under zoneless CD only repaints for signal writes.
  readonly tabLinks = signal<IPageSideNavTab[]>([]);

  // Where an app-detail error bounce (app deleted elsewhere / 404 / permission
  // lost) should land: back to the per-CF applications tab when the app was
  // opened from there (?breadcrumbs=cf), otherwise the global cross-CF wall.
  // Keeps CF-scoped context CF-scoped, matching the delete flow's redirect.
  static appErrorRedirect(breadcrumbs: string | null | undefined, cfGuid: string): string[] {
    return breadcrumbs === 'cf' ? ['/cloud-foundry', cfGuid, 'applications'] : ['applications'];
  }

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
        // CF-scoped breadcrumb: emitted when the row link on the per-CF
        // applications wall (CloudFoundryApplicationsSignal) passes
        // ?breadcrumbs=cf. Sends the user back to the CF endpoint and the
        // scoped Applications wall they came from, not the global one.
        key: 'cf',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/summary` },
          { value: 'Applications', routerLink: `${baseCFUrl}/applications` }
        ]
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
          // Stay CF-scoped when the app was opened from the per-CF applications
          // tab (?breadcrumbs=cf) — mirror the delete flow's redirect so an
          // error bounce doesn't kick the user out to the global cross-CF wall.
          const breadcrumbs = this.router.parseUrl(this.router.url).queryParams['breadcrumbs'];
          this.router.navigate(
            ApplicationTabsBaseComponent.appErrorRedirect(breadcrumbs, this.applicationService.cfGuid),
          );
        }
      });
    });
  }

  // Loading-overlay text reflects the active tab — e.g. "Retrieving Events" on
  // the Events tab — instead of always "Retrieving application". Falls back to
  // the app text for the base route / unknown tabs.
  loadingText(): string {
    const last = this.router.url.split('?')[0].split('/').filter(Boolean).pop();
    const tab = this.tabLinks().find(t => t.link === last);
    return tab ? `Retrieving ${tab.label}` : 'Retrieving application';
  }

  ngOnDestroy() {
    this.lifecycleProgress.destroy();
    this.errorRedirectEffect?.destroy();
  }
}
