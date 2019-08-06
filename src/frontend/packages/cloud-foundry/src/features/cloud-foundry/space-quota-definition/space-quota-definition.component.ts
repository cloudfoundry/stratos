import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { GetSpaceQuotaDefinition } from '../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import { IOrganization, ISpace, ISpaceQuotaDefinition } from '../../../../../core/src/core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/src/core/entity-service-factory.service';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { AppState } from '../../../../../store/src/app-state';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QuotaDefinitionBaseComponent } from '../quota-definition-base/quota-definition-base.component';

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
  detailsLoading$: Observable<boolean>;
  spaceSubscriber: Subscription;

  constructor(
    protected entityServiceFactory: EntityServiceFactory,
    protected store: Store<AppState>,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    activatedRoute: ActivatedRoute,
  ) {
    super(entityServiceFactory, store, activeRouteCfOrgSpace, activatedRoute);
    this.setupQuotaDefinitionObservable();
  }

  setupQuotaDefinitionObservable() {
    const quotaGuid$ = this.quotaGuid ? of(this.quotaGuid) : this.space$.pipe(map(space => space.entity.space_quota_definition_guid));
    const entityInfo$ = quotaGuid$.pipe(
      first(),
      switchMap(quotaGuid => this.entityServiceFactory.create<APIResource<ISpaceQuotaDefinition>>(
        quotaGuid,
        new GetSpaceQuotaDefinition(quotaGuid, this.cfGuid)
      ).entityObs$
      )
    );

    this.quotaDefinition$ = entityInfo$.pipe(
      filter(definition => !!definition && !!definition.entity),
      map(definition => definition.entity)
    );
    this.detailsLoading$ = entityInfo$.pipe(
      filter(definition => !!definition),
      map(definition => definition.entityRequestInfo.fetching)
    );
  }

  protected getBreadcrumbs(
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
    space: APIResource<ISpace>
  ) {
    const baseCFUrl = `/cloud-foundry/${this.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.metadata.guid}`;
    const baseSpaceUrl = `${baseOrgUrl}/spaces/${space.metadata.guid}`;

    const breadcrumbs: IHeaderBreadcrumb[] = [
      {
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.entity.name, routerLink: `${baseOrgUrl}/spaces` },
          { value: space.entity.name, routerLink: `${baseSpaceUrl}/summary` },
        ],
      },
    ];

    return breadcrumbs;
  }
}
