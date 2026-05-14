import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CustomTooltipDirective } from '@stratosui/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { BooleanIndicatorComponent } from '../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { CardNumberMetricComponent } from '../../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';
import { LoadingPageComponent } from '../../../../../core/src/shared/components/loading-page/loading-page.component';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { PageSubNavComponent } from '../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { TileGridComponent } from '../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../core/src/shared/components/tile/tile/tile.component';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { IOrganization, ISpace, ISpaceQuotaDefinition } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { CfEndpointsDataService } from '../../../services/domain-data/cf-endpoints-data.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QuotaDefinitionBaseComponent } from '../quota-definition-base/quota-definition-base.component';

export const QUOTA_SPACE_GUID = 'space';

@Component({
  selector: 'app-space-quota-definition',
  styleUrls: ['../quota-definition-base/quota-definition-base.component.scss'],
  templateUrl: './space-quota-definition.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CustomTooltipDirective,
    PageHeaderComponent,
    PageSubNavComponent,
    LoadingPageComponent,
    BooleanIndicatorComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
  ]
})
export class SpaceQuotaDefinitionComponent extends QuotaDefinitionBaseComponent {
  declare breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  spaceQuotaDefinition$!: Observable<APIResource<ISpaceQuotaDefinition>>;
  declare cfGuid: string;
  declare orgGuid: string;
  declare spaceGuid: string;
  declare quotaGuid: string;
  editLink$!: Observable<string[]>;
  editParams!: object;
  declare detailsLoading$: Observable<boolean>;
  spaceSubscriber!: Subscription;
  public canEditQuota$: Observable<boolean>;
  public isOrg = false;

  constructor() {
    const endpoints = inject(CfEndpointsDataService);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const activatedRoute = inject(ActivatedRoute);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);

    super(endpoints, activeRouteCfOrgSpace, activatedRoute);

    this.setupQuotaDefinitionObservable();
    const { cfGuid, orgGuid, spaceGuid } = activeRouteCfOrgSpace;
    this.canEditQuota$ = currentUserPermissionsService.can(CfCurrentUserPermissions.SPACE_QUOTA_EDIT, cfGuid, orgGuid);
    this.isOrg = !spaceGuid;
    this.editParams = { [QUOTA_SPACE_GUID]: spaceGuid };
  }

  setupQuotaDefinitionObservable() {
    const quotaGuid$ = this.quotaGuid ? of(this.quotaGuid) : this.space$.pipe(map(space => space.entity.space_quota_definition_guid));
    const entityInfo$ = quotaGuid$.pipe(
      take(1),
      switchMap(quotaGuid => cfEntityCatalog.spaceQuota.store.getEntityService(quotaGuid, this.cfGuid, {}).entityObs$)
    );

    this.quotaDefinition$ = entityInfo$.pipe(
      filter(definition => !!definition && !!definition.entity),
      map(definition => definition.entity)
    );
    this.detailsLoading$ = entityInfo$.pipe(
      filter(definition => !!definition),
      map(definition => definition.entityRequestInfo.fetching)
    );

    this.editLink$ = quotaGuid$.pipe(
      map(quotaGuid => [
        '/cloud-foundry',
        this.cfGuid,
        'organizations',
        this.orgGuid,
        'space-quota-definitions',
        quotaGuid,
        'edit-space-quota'
      ])
    );
  }

  protected getBreadcrumbs(
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
    space: APIResource<ISpace>
  ) {
    const baseCFUrl = `/cloud-foundry/${this.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.metadata.guid}`;

    const breadcrumbs: IHeaderBreadcrumb[] = [
      {
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.entity.name, routerLink: `${baseOrgUrl}/space-quota-definitions` },
        ] },
    ];

    if (space) {
      const baseSpaceUrl = `${baseCFUrl}/organizations/${org.metadata.guid}/spaces/${space.metadata.guid}`;

      breadcrumbs.push({
        key: 'space',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.entity.name, routerLink: `${baseOrgUrl}/spaces` },
          { value: space.entity.name, routerLink: `${baseSpaceUrl}/summary` },
        ]
      });
    }

    return breadcrumbs;
  }
}
