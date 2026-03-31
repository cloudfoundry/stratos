import { Component, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../../../../../core/src/core/extension/extension-service';
import { environment } from '../../../../../../../../core/src/environments/environment.prod';
import { IPageSideNavTab } from '../../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { PageHeaderComponent } from '../../../../../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../../../../../core/src/shared/components/page-header/page-header.types';
import { LoadingPageComponent } from '../../../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
import { CFAppState } from '../../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { spaceEntityType } from '../../../../../../cf-entity-types';
import { ISpaceFavMetadata } from '../../../../../../cf-metadata-types';
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
    CloudFoundryUserProvidedServicesService
  ]
})
export class CloudFoundrySpaceBaseComponent implements OnDestroy {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  private store = inject<Store<CFAppState>>(Store);
  private confirmDialog = inject(ConfirmationDialogService);


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

  public name$: Observable<string>;

  public isFetching$: Observable<boolean>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public schema = cfEntityFactory(spaceEntityType);

  private deleteRedirectSub: Subscription;

  private quotaLinkSub!: Subscription;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);
  public favorite$: Observable<UserFavorite<ISpaceFavMetadata>>;

  constructor() {
    const cfEndpointService = this.cfEndpointService;
    const cfSpaceService = this.cfSpaceService;
    const cfOrgService = this.cfOrgService;
    const userFavoriteManager = inject(UserFavoriteManager);

    this.favorite$ = cfSpaceService.space$.pipe(
      map(space => userFavoriteManager.getFavorite<ISpaceFavMetadata>(space.entity, spaceEntityType, CF_ENDPOINT_TYPE))
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
