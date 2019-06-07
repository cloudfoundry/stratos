import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { filter, first, map, startWith, switchMap } from 'rxjs/operators';

import { GetOrganization } from '../../../../../store/src/actions/organization.actions';
import { GetQuotaDefinition } from '../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../store/src/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  quotaDefinitionSchemaKey,
} from '../../../../../store/src/helpers/entity-factory';
import { endpointEntitiesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { IOrganization, IQuotaDefinition } from '../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-quota-definition',
  templateUrl: './quota-definition.component.html',
  styleUrls: ['./quota-definition.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService
  ]
})
export class QuotaDefinitionComponent {
  breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  quotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  org$: Observable<APIResource<IOrganization>>;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  quotaGuid: string;
  detailsLoading$: Observable<boolean>;
  orgSubscriber: Subscription;

  constructor(
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
    private store: Store<AppState>,
    activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid || activatedRoute.snapshot.queryParams.orgGuid;
    this.quotaGuid = activatedRoute.snapshot.params.quotaId;
    this.setupOrgObservable();
    this.setupBreadcrumbs();
    this.setupQuotaDefinitionObservable();
  }

  setupOrgObservable() {
    if (this.orgGuid) {
      this.org$ = this.entityServiceFactory.create<APIResource<IOrganization>>(
        organizationSchemaKey,
        entityFactory(organizationSchemaKey),
        this.orgGuid,
        new GetOrganization(this.orgGuid, this.cfGuid),
        true
      ).waitForEntity$.pipe(
        map(data => data.entity),
      );
    }
  }

  setupQuotaDefinitionObservable() {
    const quotaGuid$ = this.quotaGuid ? of(this.quotaGuid) : this.org$.pipe(map(org => org.entity.quota_definition_guid));
    const entityInfo$ = quotaGuid$.pipe(
      first(),
      switchMap(quotaGuid => this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
        quotaDefinitionSchemaKey,
        entityFactory(quotaDefinitionSchemaKey),
        quotaGuid,
        new GetQuotaDefinition(quotaGuid, this.cfGuid),
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

  private setupBreadcrumbs() {
    const endpoints$ = this.store.select(endpointEntitiesSelector);
    const org$ = this.org$ ? this.org$ : of(null);
    this.breadcrumbs$ = combineLatest(endpoints$, org$).pipe(
      map(([endpoints, org]) => this.getBreadcrumbs(endpoints[this.cfGuid], org)),
      first()
    );
  }

  private getBreadcrumbs(
    endpoint: EndpointModel,
    org: APIResource<IOrganization>
  ) {
    const baseCFUrl = `/cloud-foundry/${this.activeRouteCfOrgSpace.cfGuid}`;

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
    }

    return breadcrumbs;
  }
}
