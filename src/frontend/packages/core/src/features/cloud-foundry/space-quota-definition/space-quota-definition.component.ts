import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { filter, first, map, startWith } from 'rxjs/operators';

import { GetOrganization } from '../../../../../store/src/actions/organization.actions';
import { GetSpaceQuotaDefinition } from '../../../../../store/src/actions/quota-definitions.actions';
import { GetSpace } from '../../../../../store/src/actions/space.actions';
import { AppState } from '../../../../../store/src/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/src/helpers/entity-factory';
import { endpointEntitiesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { IOrganization, IQuotaDefinition, ISpace } from '../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-space-quota-definition',
  styleUrls: ['./space-quota-definition.component.scss'],
  templateUrl: './space-quota-definition.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService
  ]
})
export class SpaceQuotaDefinitionComponent implements OnDestroy {
  breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  spaceQuotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  quotaGuid: string;
  detailsLoading$: Observable<boolean>;
  spaceSubscriber: Subscription;

  constructor(
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
    private store: Store<AppState>,
    activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.spaceGuid = activeRouteCfOrgSpace.spaceGuid || activatedRoute.snapshot.queryParams.spaceGuid;
    this.quotaGuid = activatedRoute.snapshot.params.quotaId;

    this.buildBreadcrumbs();
    this.fetchQuotaDefinition();
  }

  ngOnDestroy(): void {
    if (this.spaceSubscriber) {
      this.spaceSubscriber.unsubscribe();
    }
  }

  fetchOrg() {
    return this.entityServiceFactory.create<APIResource<IOrganization>>(
      organizationSchemaKey,
      entityFactory(organizationSchemaKey),
      this.orgGuid,
      new GetOrganization(this.orgGuid, this.cfGuid),
      true
    ).waitForEntity$.pipe(
      map(data => data.entity),
    );
  }

  fetchSpace() {
    return this.entityServiceFactory.create<APIResource<ISpace>>(
      spaceSchemaKey,
      entityFactory(spaceSchemaKey),
      this.spaceGuid,
      new GetSpace(this.spaceGuid, this.cfGuid),
      true
    ).waitForEntity$.pipe(
      map(data => data.entity),
    );
  }

  fetchQuotaDefinition() {
    const quotaSpace = { entity: { space_quota_definition_guid: this.quotaGuid } };
    const obs$: Observable<any> = this.quotaGuid ? of(quotaSpace) : this.fetchSpace();
    this.spaceSubscriber = obs$.subscribe((space) => {
      this.spaceQuotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
        spaceQuotaSchemaKey,
        entityFactory(spaceQuotaSchemaKey),
        space.entity.space_quota_definition_guid,
        new GetSpaceQuotaDefinition(space.entity.space_quota_definition_guid, this.cfGuid),
      ).waitForEntity$.pipe(
        map(data => data.entity),
      );
      this.detailsLoading$ = this.spaceQuotaDefinition$.pipe(
        filter(data => !!data.entity),
        map(() => false),
        startWith(true)
      );
    });
  }

  private buildBreadcrumbs() {
    const endpoints$ = this.store.select(endpointEntitiesSelector);
    const org$ = this.fetchOrg();
    this.breadcrumbs$ = combineLatest(endpoints$, org$).pipe(
      map(([endpoints, org]) => {
        return this.getBreadcrumbs(
          endpoints[this.cfGuid],
          org
        );
      }),
      first()
    );
  }

  private getBreadcrumbs(
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
  ) {
    const baseCFUrl = `/cloud-foundry/${this.activeRouteCfOrgSpace.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.metadata.guid}`;

    const breadcrumbs: IHeaderBreadcrumb[] = [
      {
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.entity.name, routerLink: `${baseOrgUrl}/space-quota-definitions` },
        ],
      },
    ];

    return breadcrumbs;
  }
}
