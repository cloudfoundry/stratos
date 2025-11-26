import { CommonModule, AsyncPipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { type Observable, of, type Subscription } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  BooleanIndicatorComponent,
  CardNumberMetricComponent,
  CustomTooltipDirective,
  LoadingPageComponent,
  PageHeaderComponent,
  type IHeaderBreadcrumb,
  PageSubNavComponent,
  TileGridComponent,
  TileGroupComponent,
  TileComponent
} from '@stratosui/core';
import type { APIResource } from '../../../../../store/src/types/api.types';
import type { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import type { IOrganization, ISpace, ISpaceQuotaDefinition } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QuotaDefinitionBaseComponent } from '../quota-definition-base/quota-definition-base.component';

export const QUOTA_SPACE_GUID = 'space';

@Component({
  selector: 'app-space-quota-definition',
  styleUrls: ['../quota-definition-base/quota-definition-base.component.scss', './space-quota-definition.component.scss'],
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

  constructor(
    protected store: Store,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    activatedRoute: ActivatedRoute,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    super(store, activeRouteCfOrgSpace, activatedRoute);
    this.setupQuotaDefinitionObservable();
    const { cfGuid, orgGuid, spaceGuid } = activeRouteCfOrgSpace;
    this.canEditQuota$ = currentUserPermissionsService.can(CfCurrentUserPermissions.SPACE_QUOTA_EDIT, cfGuid, orgGuid);
    this.isOrg = !spaceGuid;
    this.editParams = { [QUOTA_SPACE_GUID]: spaceGuid };
  }

  setupQuotaDefinitionObservable() {
    const quotaGuid$ = this.quotaGuid ? of(this.quotaGuid) : this.space$.pipe(map(space => space.entity.space_quota_definition_guid));
    const entityInfo$ = quotaGuid$.pipe(
      first(),
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
        ],
      },
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
