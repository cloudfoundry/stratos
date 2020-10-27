import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { AppState } from '../../../../../store/src/app-state';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
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
  styleUrls: ['../quota-definition-base/quota-definition-base.component.scss', './quota-definition.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class QuotaDefinitionComponent extends QuotaDefinitionBaseComponent {
  breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  quotaDefinition$: Observable<APIResource<IOrgQuotaDefinition>>;
  org$: Observable<APIResource<IOrganization>>;
  space$: Observable<APIResource<ISpace>>;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  quotaGuid: string;
  editLink$: Observable<string[]>;
  editParams: object;
  detailsLoading$: Observable<boolean>;
  orgSubscriber: Subscription;
  public canEditQuota$: Observable<boolean>;
  public isCf = false;

  constructor(
    protected store: Store<AppState>,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    activatedRoute: ActivatedRoute,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    super(store, activeRouteCfOrgSpace, activatedRoute);
    this.setupQuotaDefinitionObservable();
    const { cfGuid, orgGuid } = activeRouteCfOrgSpace;
    this.canEditQuota$ = currentUserPermissionsService.can(CfCurrentUserPermissions.QUOTA_EDIT, cfGuid);
    this.isCf = !orgGuid;
    this.editParams = { [QUOTA_ORG_GUID]: orgGuid };
  }

  setupQuotaDefinitionObservable() {
    const quotaGuid$ = this.quotaGuid ? of(this.quotaGuid) : this.org$.pipe(map(org => org.entity.quota_definition_guid));
    const entityInfo$ = quotaGuid$.pipe(
      first(),
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
