import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { CustomTooltipDirective, CurrentUserPermissionsService, PageHeaderComponent, IHeaderBreadcrumb, PageSubNavComponent, BooleanIndicatorComponent, LoadingPageComponent, CardNumberMetricComponent, TileGridComponent, TileGroupComponent, TileComponent } from '@stratosui/core';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';
import { AppState, APIResource, EndpointModel } from '@stratosui/store';
import { IOrganization, IOrgQuotaDefinition, ISpace } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QuotaDefinitionBaseComponent } from '../quota-definition-base/quota-definition-base.component';

export const QUOTA_ORG_GUID = 'org';

@Component({
  selector: 'app-quota-definition',
  templateUrl: './quota-definition.component.html',
  styleUrls: ['../quota-definition-base/quota-definition-base.component.scss'],
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
    BooleanIndicatorComponent,
    LoadingPageComponent,
    CardNumberMetricComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent
  ]
})
export class QuotaDefinitionComponent extends QuotaDefinitionBaseComponent {
  protected store: Store<AppState>;

  declare breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  declare quotaDefinition$: Observable<APIResource<IOrgQuotaDefinition>>;
  declare org$: Observable<APIResource<IOrganization>>;
  declare space$: Observable<APIResource<ISpace>>;
  declare cfGuid: string;
  declare orgGuid: string;
  declare spaceGuid: string;
  declare quotaGuid: string;
  editLink$!: Observable<string[]>;
  editParams: object;
  declare detailsLoading$: Observable<boolean>;
  declare orgSubscriber: Subscription;
  public canEditQuota$!: Observable<boolean>;
  public isCf = false;

  constructor() {
    const store = inject<Store<AppState>>(Store);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const activatedRoute = inject(ActivatedRoute);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);

    super(store, activeRouteCfOrgSpace, activatedRoute);
    this.store = store;

    this.setupQuotaDefinitionObservable();
    const { cfGuid, orgGuid } = activeRouteCfOrgSpace;
    this.canEditQuota$ = currentUserPermissionsService.can(CfCurrentUserPermissions.QUOTA_EDIT, cfGuid);
    this.isCf = !orgGuid;
    this.editParams = { [QUOTA_ORG_GUID]: orgGuid };
  }

  setupQuotaDefinitionObservable() {
    const quotaGuid$ = this.quotaGuid ? of(this.quotaGuid) : this.org$.pipe(map(org => org.entity.quota_definition_guid));
    const entityInfo$ = quotaGuid$.pipe(
      take(1),
      switchMap(quotaGuid => cfEntityCatalog.quotaDefinition.store.getEntityService(quotaGuid, this.cfGuid, {}).entityObs$)
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
        'quota-definitions',
        quotaGuid,
        'edit-quota'
      ])
    );
  }

  protected getBreadcrumbs(
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
    space: APIResource<ISpace>
  ) {
    const baseCFUrl = `/cloud-foundry/${this.cfGuid}`;

    const breadcrumbs: IHeaderBreadcrumb[] = [{
      breadcrumbs: [
        { value: endpoint.name, routerLink: `${baseCFUrl}/quota-definitions` },
      ]
    }];

    if (org) {
      const baseOrgUrl = `${baseCFUrl}/organizations/${org.metadata.guid}`;

      breadcrumbs.push({
        key: 'org',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.entity.name, routerLink: `${baseOrgUrl}/summary` },
        ]
      });

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
    }

    return breadcrumbs;
  }
}
