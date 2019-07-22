import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, Subscription } from 'rxjs';
import { filter, first, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { applicationSchemaKey, entityFactory } from '../../../../../../store/src/helpers/entity-factory';
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
import { IHeaderBreadcrumb } from '../../../../shared/components/page-header/page-header.types';
import { GitSCMService, GitSCMType } from '../../../../shared/data-services/scm/scm.service';
import { ENTITY_SERVICE } from '../../../../shared/entity.tokens';
import { IPageSideNavTab } from '../../../dashboard/page-side-nav/page-side-nav.component';
import { ApplicationService } from '../../application.service';
import { EndpointsService } from './../../../../core/endpoints.service';
import { ApplicationPollingService } from './application-polling.service';

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss'],
  providers: [ApplicationPollingService]
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  public schema = entityFactory(applicationSchemaKey);
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
    public applicationService: ApplicationService,
    @Inject(ENTITY_SERVICE) private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private endpointsService: EndpointsService,
    private ngZone: NgZone,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    scmService: GitSCMService,
    private appPollingService: ApplicationPollingService
  ) {
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
      switchMap(space => this.currentUserPermissionsService.can(CurrentUserPermissions.APPLICATION_VIEW_ENV_VARS,
        this.applicationService.cfGuid, space.metadata.guid)
      ),
      map(can => !can)
    );

    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'description' },
      { link: 'instances', label: 'Instances', icon: 'library_books' },
      { link: 'routes', label: 'Routes', iconFont: 'stratos-icons', icon: 'network_route' },
      { link: 'log-stream', label: 'Log Stream', icon: 'featured_play_list' },
      { link: 'services', label: 'Services', iconFont: 'stratos-icons', icon: 'service' },
      { link: 'variables', label: 'Variables', icon: 'list', hidden$: appDoesNotHaveEnvVars$ },
      { link: 'events', label: 'Events', icon: 'watch_later' }
    ];

    this.endpointsService.hasMetrics(applicationService.cfGuid).subscribe(hasMetrics => {
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
          const scm = scmService.getSCM(gitscm as GitSCMType);
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
  isFetching$: Observable<boolean>;
  applicationActions$: Observable<string[]>;
  summaryDataChanging$: Observable<boolean>;
  appSub$: Subscription;
  stratosProjectSub: Subscription;

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
