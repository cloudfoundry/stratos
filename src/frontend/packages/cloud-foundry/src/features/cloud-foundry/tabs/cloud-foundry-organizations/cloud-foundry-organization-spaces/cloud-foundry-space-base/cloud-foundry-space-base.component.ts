import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { spaceEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { ISpaceFavMetadata } from '../../../../../../../../cloud-foundry/src/cf-metadata-types';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../../../../../core/src/core/extension/extension-service';
import { getFavoriteFromEntity } from '../../../../../../../../core/src/core/user-favorite-helpers';
import { environment } from '../../../../../../../../core/src/environments/environment.prod';
import { IPageSideNavTab } from '../../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import {
  FavoritesConfigMapper,
} from '../../../../../../../../core/src/shared/components/favorites-meta-card/favorite-config-mapper';
import { IHeaderBreadcrumb } from '../../../../../../../../core/src/shared/components/page-header/page-header.types';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { CfUserService } from '../../../../../../shared/data-services/cf-user.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../services/cloud-foundry-space.service';

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  styleUrls: ['./cloud-foundry-space-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundrySpaceService,
    CloudFoundryOrganizationService,
    CloudFoundryUserProvidedServicesService
  ]
})
export class CloudFoundrySpaceBaseComponent implements OnDestroy {

  tabLinks: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      icon: 'description'
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
      icon: 'network_route'
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

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  public isFetching$: Observable<boolean>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public schema = cfEntityFactory(spaceEntityType);

  private deleteRedirectSub: Subscription;

  private quotaLinkSub: Subscription;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);
  public favorite$: Observable<UserFavorite<ISpaceFavMetadata>>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfSpaceService: CloudFoundrySpaceService,
    public cfOrgService: CloudFoundryOrganizationService,
    private store: Store<CFAppState>,
    private confirmDialog: ConfirmationDialogService,
    favoritesConfigMapper: FavoritesConfigMapper
  ) {
    this.favorite$ = cfSpaceService.space$.pipe(
      map(space => getFavoriteFromEntity<ISpaceFavMetadata>(space.entity, spaceEntityType, favoritesConfigMapper, CF_ENDPOINT_TYPE))
    );
    this.isFetching$ = cfSpaceService.space$.pipe(
      map(space => space.entityRequestInfo.fetching)
    );
    this.name$ = cfSpaceService.space$.pipe(
      map(space => space.entity.entity.name),
      first()
    );

    this.setUpBreadcrumbs(cfEndpointService, cfOrgService);

    this.deleteRedirectSub = this.cfSpaceService.space$.pipe(
      tap(({ entityRequestInfo }) => {
        if (entityRequestInfo.deleting.deleted) {
          this.store.dispatch(new RouterNav({
            path: [
              'cloud-foundry',
              this.cfSpaceService.cfGuid,
              'organizations',
              this.cfSpaceService.orgGuid,
              'spaces']
          }));
        }
      })
    ).subscribe();

    // Add any tabs from extensions
    this.setupLinks();
  }

  private setupLinks() {
    this.quotaLinkSub = this.cfSpaceService.space$.pipe(
      tap((space) => {
        this.tabLinks.push({
          link: 'space-quota',
          label: 'Quota',
          icon: 'data_usage',
          hidden$: of(!space.entity.entity.space_quota_definition)
        });
        this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.CloudFoundrySpace));
      }),
      first()
    ).subscribe();
  }

  private setUpBreadcrumbs(
    cfEndpointService: CloudFoundryEndpointService,
    cfOrgService: CloudFoundryOrganizationService
  ) {
    this.breadcrumbs$ = combineLatest(
      cfEndpointService.endpoint$,
      cfOrgService.org$
    ).pipe(
      map(([endpoint, org]) => ([
        {
          breadcrumbs: [
            {
              value: endpoint.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations`
            },
            {
              value: org.entity.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations/${org.entity.metadata.guid}/spaces`
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
      first()
    );
  }

  ngOnDestroy() {
    this.deleteRedirectSub.unsubscribe();
    this.quotaLinkSub.unsubscribe();
  }
}
