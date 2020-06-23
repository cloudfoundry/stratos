import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { organizationEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { IOrgFavMetadata } from '../../../../../../../cloud-foundry/src/cf-metadata-types';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../../../../core/src/core/extension/extension-service';
import { environment } from '../../../../../../../core/src/environments/environment.prod';
import { IPageSideNavTab } from '../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { IHeaderBreadcrumb } from '../../../../../../../core/src/shared/components/page-header/page-header.types';
import { FavoritesConfigMapper } from '../../../../../../../store/src/favorite-config-mapper';
import { EntitySchema } from '../../../../../../../store/src/helpers/entity-schema';
import { UserFavorite } from '../../../../../../../store/src/types/user-favorites.types';
import { getFavoriteFromEntity } from '../../../../../../../store/src/user-favorite-helpers';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-cloud-foundry-organization-base',
  templateUrl: './cloud-foundry-organization-base.component.html',
  styleUrls: ['./cloud-foundry-organization-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService,
    CloudFoundryUserProvidedServicesService
  ]
})
export class CloudFoundryOrganizationBaseComponent {

  tabLinks: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      icon: 'description'
    },
    {
      link: 'spaces',
      label: 'Spaces',
      icon: 'language'
    },
    {
      link: 'users',
      label: 'Users',
      icon: 'people'
    },
    {
      link: 'quota',
      label: 'Quota',
      icon: 'data_usage'
    },
    {
      link: 'space-quota-definitions',
      label: 'Space Quotas',
      icon: 'data_usage'
    },
    {
      link: 'events',
      label: 'Events',
      icon: 'watch_later'
    }
  ];
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public schema: EntitySchema;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);

  public favorite$: Observable<UserFavorite<IOrgFavMetadata>>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    favoritesConfigMapper: FavoritesConfigMapper
  ) {
    this.schema = cfEntityFactory(organizationEntityType);
    this.favorite$ = cfOrgService.org$.pipe(
      first(),
      map(org => getFavoriteFromEntity<IOrgFavMetadata>(org.entity, organizationEntityType, favoritesConfigMapper, CF_ENDPOINT_TYPE))
    );
    this.name$ = cfOrgService.org$.pipe(
      map(org => org.entity.entity.name),
      filter(name => !!name),
      first()
    );
    this.breadcrumbs$ = this.getBreadcrumbs();

    // Add any tabs from extensions
    this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.CloudFoundryOrg));
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
      first()
    );
  }
}
