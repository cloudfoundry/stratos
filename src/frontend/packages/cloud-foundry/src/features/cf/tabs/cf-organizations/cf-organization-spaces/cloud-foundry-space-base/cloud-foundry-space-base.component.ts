import { Component, ChangeDetectionStrategy, computed, OnInit, Signal, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../../../../../core/src/core/extension/extension-service';
import { environment } from '../../../../../../../../core/src/environments/environment.prod';
import { IPageSideNavTab } from '../../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { PageHeaderComponent } from '../../../../../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../../../../../core/src/shared/components/page-header/page-header.types';
import { LoadingPageComponent } from '../../../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { PageSubNavComponent } from '../../../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { CfCliMenuComponent } from '../../../../../../shared/components/cli-menu/cf-cli-menu.component';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
import { spaceEntityType } from '../../../../../../cf-entity-types';
import { ISpaceFavMetadata } from '../../../../../../cf-metadata-types';
import { SpaceDataRegistry } from '../../../../../../services/endpoint-data/space-data.registry';
import { SpaceDataService } from '../../../../../../services/endpoint-data/space-data.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../services/cloud-foundry-space.service';

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    PageHeaderComponent,
    PageSubNavComponent,
    LoadingPageComponent,
    CfCliMenuComponent,
  ],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundrySpaceService,
    CloudFoundryOrganizationService,
    CloudFoundryUserProvidedServicesService,
    // Provide a single SpaceDataService instance for this space-detail subtree
    // (mirrors the OrgDataService factory on cloud-foundry-organization-base).
    {
      provide: SpaceDataService,
      useFactory: (registry: SpaceDataRegistry, route: ActiveRouteCfOrgSpace) =>
        registry.acquire(route.cfGuid, route.spaceGuid),
      deps: [SpaceDataRegistry, ActiveRouteCfOrgSpace],
    },
  ]
})
export class CloudFoundrySpaceBaseComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  spaceDataService = inject(SpaceDataService);

  // Drives the loading-page overlay from the signal-native data service,
  // replacing the old ngrx EntityMonitor (entityId/entitySchema) path.
  isLoading = this.spaceDataService.isLoading;


  private readonly baseTabs: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      icon: 'virtual_space',
      iconFont: 'stratos-icons',
    },
    {
      link: 'apps',
      label: 'Applications',
      icon: 'apps'
    },
    {
      link: 'service-instances',
      label: 'Services',
      iconFont: 'stratos-icons',
      icon: 'service'
    },
    {
      link: 'user-service-instances',
      label: 'User Services',
      iconFont: 'stratos-icons',
      icon: 'service_square'
    },
    {
      link: 'routes',
      label: 'Routes',
      iconFont: 'stratos-icons',
      icon: 'route'
    },
    {
      link: 'users',
      label: 'Users',
      icon: 'people'
    },
    {
      link: 'events',
      label: 'Events',
      icon: 'watch_later'
    }
  ];

  // The Quota tab joins once the space has loaded, and shows only while a
  // space-specific quota is linked (quotaGuid set). Extension tabs are
  // appended unconditionally to match the legacy ordering.
  private readonly spaceLoaded = computed(() => !!this.spaceDataService.space());
  private readonly hasSpaceQuota = computed(() => !!this.spaceDataService.space()?.quotaGuid);
  readonly tabLinks = computed<IPageSideNavTab[]>(() => {
    if (!this.spaceLoaded()) {
      return this.baseTabs;
    }
    return [
      ...this.baseTabs,
      {
        link: 'space-quota',
        label: 'Quota',
        icon: 'data_usage',
        isHidden: computed(() => !this.hasSpaceQuota()),
      },
      ...getTabsFromExtensions(StratosTabType.CloudFoundrySpace),
    ];
  });

  // Back to the endpoint's organizations and to the org's spaces, once both
  // the endpoint and the org are in.
  readonly breadcrumbs = computed<IHeaderBreadcrumb[] | null>(() => {
    const endpoint = this.cfEndpointService.endpoint();
    const org = this.cfOrgService.orgDataService.org();
    if (!endpoint || !org) return null;
    return [
      {
        breadcrumbs: [
          {
            value: endpoint.entity.name,
            routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations`
          },
          {
            value: org.name,
            routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations/${org.guid}/spaces`
          }
        ]
      },
      {
        key: 'services-wall',
        breadcrumbs: [
          { value: 'Services', routerLink: `/services` }
        ]
      }
    ];
  });

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);

  // Favorite recomputes when the SpaceDataService signal lands. Synthesises
  // the minimal entity shape favorites expect: getMetadata reads name +
  // organization_guid, getGuid reads metadata.guid. The endpoint id comes from
  // the PAGE route (route.cfGuid) via getFavoriteFromEntity, NOT the row's
  // stamped cfGuid: rows can be mis-stamped when Stratos endpoints share one
  // CAPI, which would render the star on the wrong endpoint (the cross-endpoint
  // favourite leak).
  public favorite: Signal<UserFavorite<ISpaceFavMetadata> | null>;

  constructor() {
    const userFavoriteManager = inject(UserFavoriteManager);
    const route = inject(ActiveRouteCfOrgSpace);

    this.favorite = computed(() => {
      const space = this.spaceDataService.space();
      if (!space) return null;
      const favEntity = {
        entity: { name: space.name, organization_guid: space.orgGuid },
        metadata: { guid: space.guid },
      };
      return userFavoriteManager.getFavoriteFromEntity<ISpaceFavMetadata>(
        spaceEntityType, CF_ENDPOINT_TYPE, route.cfGuid, favEntity);
    });
  }

  ngOnInit(): void {
    // Trigger initial load. The registry-acquired instance dedupes concurrent
    // load() calls and short-circuits once warm.
    this.spaceDataService.load().subscribe({ error: () => {} });
  }

}
