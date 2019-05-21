import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { filter, first, map, startWith } from 'rxjs/operators';

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
export class QuotaDefinitionComponent implements OnDestroy {
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

    this.setupBreadcrumbs();
    this.fetchQuotaDefinition();
  }

  ngOnDestroy(): void {
    if (this.orgSubscriber) {
      this.orgSubscriber.unsubscribe();
    }
  }

  fetchOrg() {
    this.org$ = this.entityServiceFactory.create<APIResource<IOrganization>>(
      organizationSchemaKey,
      entityFactory(organizationSchemaKey),
      this.orgGuid,
      new GetOrganization(this.orgGuid, this.cfGuid),
      true
    ).waitForEntity$.pipe(
      map(data => data.entity),
    );

    return this.org$;
  }

  fetchQuotaDefinition() {
    const quotaOrg = { entity: { quota_definition_guid: this.quotaGuid } };
    const obs$: Observable<any> = this.quotaGuid ? of(quotaOrg) : this.fetchOrg();
    this.orgSubscriber = obs$.subscribe((org) => {
      this.quotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
        quotaDefinitionSchemaKey,
        entityFactory(quotaDefinitionSchemaKey),
        org.entity.quota_definition_guid,
        new GetQuotaDefinition(org.entity.quota_definition_guid, this.cfGuid),
      ).waitForEntity$.pipe(
        map(data => data.entity),
      );
      this.detailsLoading$ = this.quotaDefinition$.pipe(
        filter(data => !!data.entity),
        map(() => false),
        startWith(true)
      );
    });
  }

  private setupBreadcrumbs() {
    const endpoints$ = this.store.select(endpointEntitiesSelector);
    const org$ = this.orgGuid ? this.fetchOrg() : of(null);
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
