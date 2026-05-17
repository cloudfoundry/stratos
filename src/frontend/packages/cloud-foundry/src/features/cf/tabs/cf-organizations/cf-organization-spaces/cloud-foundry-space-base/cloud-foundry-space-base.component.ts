import { Component, ChangeDetectionStrategy, computed, Injector, OnInit, Signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';

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
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { spaceEntityType } from '../../../../../../cf-entity-types';
import { ISpaceFavMetadata } from '../../../../../../cf-metadata-types';
import { SpaceDataRegistry } from '../../../../../../services/endpoint-data/space-data.registry';
import { SpaceDataService } from '../../../../../../services/endpoint-data/space-data.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { CfUserService } from '../../../../../../shared/data-services/cf-user.service';
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
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    LoadingPageComponent
  ],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
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
  private injector = inject(Injector);


  tabLinks: IPageSideNavTab[] = [
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

  public breadcrumbs$!: Observable<IHeaderBreadcrumb[]>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public schema = cfEntityFactory(spaceEntityType);

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);

  // Favorite recomputes when the SpaceDataService signal lands. Synthesises
  // the minimal entity shape favorites expect: getMetadata reads name +
  // organization_guid, getGuid reads metadata.guid, getEndpointIdFromEntity
  // reads entity.cfGuid.
  public favorite: Signal<UserFavorite<ISpaceFavMetadata> | null>;

  constructor() {
    const userFavoriteManager = inject(UserFavoriteManager);

    this.favorite = computed(() => {
      const space = this.spaceDataService.space();
      if (!space) return null;
      const favEntity = {
        entity: { name: space.name, organization_guid: space.orgGuid, cfGuid: space.cnsiGuid },
        metadata: { guid: space.guid },
      };
      return userFavoriteManager.getFavorite<ISpaceFavMetadata>(favEntity, spaceEntityType, CF_ENDPOINT_TYPE);
    });

    this.setUpBreadcrumbs(this.cfEndpointService, this.cfOrgService);

    // Add the Quota tab once the space snapshot lands — only show it if a
    // space-specific quota is linked (quotaGuid set). Extension tabs are
    // appended unconditionally to match the legacy ordering.
    toObservable(this.spaceDataService.space, { injector: this.injector }).pipe(
      filter(s => !!s),
      take(1),
    ).subscribe(space => {
      this.tabLinks.push({
        link: 'space-quota',
        label: 'Quota',
        icon: 'data_usage',
        hidden$: of(!space!.quotaGuid),
      });
      this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.CloudFoundrySpace));
    });
  }

  ngOnInit(): void {
    // Trigger initial load. The registry-acquired instance dedupes concurrent
    // load() calls and short-circuits once warm.
    this.spaceDataService.load().subscribe({ error: () => {} });
  }

  private setUpBreadcrumbs(
    cfEndpointService: CloudFoundryEndpointService,
    cfOrgService: CloudFoundryOrganizationService
  ) {
    // Org name comes from the V3-native OrgDataService signal; bridge into the
    // existing breadcrumb pipeline via toObservable so the rest of the chain
    // stays the same shape. take(1) preserves the original "freeze first
    // populated value" behaviour.
    const orgSignal$ = toObservable(cfOrgService.orgDataService.org, { injector: this.injector });
    this.breadcrumbs$ = combineLatest(
      cfEndpointService.endpoint$,
      orgSignal$.pipe(filter(org => !!org)),
    ).pipe(
      map(([endpoint, org]) => ([
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
      ])),
      take(1)
    );
  }

}
