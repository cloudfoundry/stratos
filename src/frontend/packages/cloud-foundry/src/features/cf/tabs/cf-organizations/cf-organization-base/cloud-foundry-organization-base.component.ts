import { Component, ChangeDetectionStrategy, computed, inject, OnInit, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { OrgDataRegistry } from '../../../../../services/endpoint-data/org-data.registry';
import { OrgDataService } from '../../../../../services/endpoint-data/org-data.service';

import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType } from '../../../../../../../core/src/core/extension/extension-service';
import { environment } from '../../../../../../../core/src/environments/environment.prod';
import { IPageSideNavTab } from '../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumb } from '../../../../../../../core/src/shared/components/page-header/page-header.types';
import { PageHeaderComponent } from '../../../../../../../core/src/shared/components/page-header/page-header.component';
import { LoadingPageComponent } from '../../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../store/src/user-favorite-manager';
import { organizationEntityType } from '../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import {
  CloudFoundryUserProvidedServicesService } from '../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-cloud-foundry-organization-base',
  templateUrl: './cloud-foundry-organization-base.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService,
    CloudFoundryUserProvidedServicesService,
    // Provide a single OrgDataService instance for this org-detail subtree,
    // acquired from the registry so navigation away and back returns a hot
    // cached signal instead of refiring HTTP. Children inject(OrgDataService)
    // directly — no per-component acquire boilerplate.
    {
      provide: OrgDataService,
      useFactory: (registry: OrgDataRegistry, route: ActiveRouteCfOrgSpace) =>
        registry.acquire(route.cfGuid, route.orgGuid),
      deps: [OrgDataRegistry, ActiveRouteCfOrgSpace],
    },
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    LoadingPageComponent
  ]
})
export class CloudFoundryOrganizationBaseComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  orgDataService = inject(OrgDataService);

  // Drives the loading-page overlay from the signal-native data service,
  // replacing the old ngrx EntityMonitor (entityId/entitySchema) path.
  isLoading$ = toObservable(this.orgDataService.isLoading);


  tabLinks: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      icon: 'organization',
      iconFont: 'stratos-icons'
    },
    {
      link: 'spaces',
      label: 'Spaces',
      icon: 'virtual_space',
      iconFont: 'stratos-icons'
    },
    {
      link: 'users',
      label: 'Users',
      icon: 'people'
    },
    {
      link: 'quota',
      label: 'Quota',
      icon: 'quota',
      iconFont: 'stratos-icons'
    },
    {
      link: 'space-quota-definitions',
      label: 'Space Quotas',
      icon: 'quota',
      iconFont: 'stratos-icons'
    },
    {
      link: 'events',
      label: 'Events',
      icon: 'watch_later'
    }
  ];
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);

  // Favorite recomputes when the org signal lands. Built from the V3-native
  // org-detail snapshot — getMetadata reads `entity.name`, getGuid reads
  // `metadata.guid`, getEndpointIdFromEntity reads `entity.cfGuid`, so we
  // synthesise the minimal APIResource-shape favorites expect.
  public favorite: Signal<UserFavorite<IFavoriteMetadata> | null>;

  constructor() {
    const userFavoriteManager = inject(UserFavoriteManager);

    this.favorite = computed(() => {
      const org = this.orgDataService.org();
      if (!org) return null;
      const favEntity = { entity: { name: org.name, cfGuid: org.cnsiGuid }, metadata: { guid: org.guid } };
      return userFavoriteManager.getFavorite<IFavoriteMetadata>(favEntity, organizationEntityType, CF_ENDPOINT_TYPE);
    });
    this.breadcrumbs$ = this.getBreadcrumbs();

    // Add any tabs from extensions
    this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.CloudFoundryOrg));
  }

  ngOnInit(): void {
    // Trigger initial load. The registry-acquired instance dedupes concurrent
    // load() calls and short-circuits once warm, so re-entry on tab nav is a
    // no-op.
    this.orgDataService.load().subscribe({ error: () => {} });
  }

  private getBreadcrumbs() {
    return this.cfEndpointService.endpoint$.pipe(
      map(endpoint => ([
        {
          breadcrumbs: [
            {
              value: endpoint.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations`
            }
          ]
        }
      ])),
      take(1)
    );
  }
}
