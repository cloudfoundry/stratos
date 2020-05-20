import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { CurrentUserPermissions } from '../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/current-user-permissions.service';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { AppState } from '../../../../../store/src/app-state';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { IOrganization, ISpace, ISpaceQuotaDefinition } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
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
  ]
})
export class SpaceQuotaDefinitionComponent extends QuotaDefinitionBaseComponent {
  breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  spaceQuotaDefinition$: Observable<APIResource<ISpaceQuotaDefinition>>;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  quotaGuid: string;
  editLink$: Observable<string[]>;
  editParams: object;
  detailsLoading$: Observable<boolean>;
  spaceSubscriber: Subscription;
  public canEditQuota$: Observable<boolean>;
  public isOrg = false;

  constructor(
    protected store: Store<AppState>,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    activatedRoute: ActivatedRoute,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    super(store, activeRouteCfOrgSpace, activatedRoute);
    this.setupQuotaDefinitionObservable();
    const { cfGuid, orgGuid, spaceGuid } = activeRouteCfOrgSpace;
    this.canEditQuota$ = currentUserPermissionsService.can(CurrentUserPermissions.SPACE_QUOTA_EDIT, cfGuid, orgGuid);
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
