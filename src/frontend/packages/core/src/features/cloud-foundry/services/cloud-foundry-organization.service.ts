import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { GetOrganization } from '../../../../../store/src/actions/organization.actions';
import { DeleteSpace } from '../../../../../store/src/actions/space.actions';
import { AppState } from '../../../../../store/src/app-state';
import {
  domainSchemaKey,
  entityFactory,
  organizationSchemaKey,
  privateDomainsSchemaKey,
  quotaDefinitionSchemaKey,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/src/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { OrgUserRoleNames } from '../../../../../store/src/types/user.types';
import { IApp, IOrganization, IPrivateDomain, IQuotaDefinition, ISpace } from '../../../core/cf-api.types';
import { getEntityFlattenedList, getStartedAppInstanceCount } from '../../../core/cf.helpers';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { fetchServiceInstancesCount } from '../../service-catalog/services-helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getOrgRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

export const createQuotaDefinition = (orgGuid: string): IQuotaDefinition => ({
  memory_limit: -1,
  app_instance_limit: -1,
  instance_memory_limit: -1,
  name: 'None assigned',
  organization_guid: orgGuid,
  total_services: -1,
  total_routes: -1
});

@Injectable()
export class CloudFoundryOrganizationService {
  orgGuid: string;
  cfGuid: string;
  quotaLink$: Observable<string[]>;
  userOrgRole$: Observable<string>;
  quotaDefinition$: Observable<IQuotaDefinition>;
  totalMem$: Observable<number>;
  privateDomains$: Observable<APIResource<IPrivateDomain>[]>;
  routes$: Observable<APIResource<Route>[]>;
  serviceInstancesCount$: Observable<number>;
  userProvidedServiceInstancesCount$: Observable<number>;
  spaces$: Observable<APIResource<ISpace>[]>;
  appInstances$: Observable<number>;
  apps$: Observable<APIResource<IApp>[]>;
  appCount$: Observable<number>;
  loadingApps$: Observable<boolean>;
  org$: Observable<EntityInfo<APIResource<IOrganization>>>;
  usersCount$: Observable<number | null>;

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfEndpointService: CloudFoundryEndpointService,
    private cfUserProvidedServicesService: CloudFoundryUserProvidedServicesService
  ) {
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;

    this.initialiseObservables();
  }

  public deleteSpace(spaceGuid: string, orgGuid: string, endpointGuid: string) {
    this.store.dispatch(new DeleteSpace(spaceGuid, orgGuid, endpointGuid));
  }

  public fetchApps() {
    this.cfEndpointService.fetchApps();
  }

  private initialiseObservables() {
    this.org$ = this.cfUserService.isConnectedUserAdmin(this.cfGuid).pipe(
      switchMap(isAdmin => {
        const relations = [
          createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
          createEntityRelationKey(organizationSchemaKey, domainSchemaKey),
          createEntityRelationKey(organizationSchemaKey, quotaDefinitionSchemaKey),
          createEntityRelationKey(organizationSchemaKey, privateDomainsSchemaKey),
          createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
        ];
        if (!isAdmin) {
          // We're only interested in fetching org roles via the org request for non-admins.
          // Non-admins cannot fetch missing roles via the users entity as the `<x>_url` is invalid
          // #2902 Scaling Orgs/Spaces Inline --> individual capped requests & handling
          relations.push(
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.USER),
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.MANAGER),
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.BILLING_MANAGERS),
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.AUDITOR),
          );
        }
        const orgEntityService = this.entityServiceFactory.create<APIResource<IOrganization>>(
          organizationSchemaKey,
          entityFactory(organizationSchemaKey),
          this.orgGuid,
          new GetOrganization(this.orgGuid, this.cfGuid, relations),
          true
        );
        return orgEntityService.waitForEntity$;
      }),
      publishReplay(1),
      refCount()
    );

    this.initialiseOrgObservables();

    this.initialiseAppObservables();

    this.initialiseSpaceObservables();

    this.userOrgRole$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => this.cfUserService.getUserRoleInOrg(u.guid, this.orgGuid, this.cfGuid)),
      map(u => getOrgRolesString(u))
    );

    this.serviceInstancesCount$ = fetchServiceInstancesCount(this.cfGuid, this.orgGuid, null, this.store, this.paginationMonitorFactory);
    this.userProvidedServiceInstancesCount$ =
      this.cfUserProvidedServicesService.fetchUserProvidedServiceInstancesCount(this.cfGuid, this.orgGuid);
  }

  private initialiseSpaceObservables() {
    this.routes$ = this.spaces$.pipe(this.getFlattenedList('routes'));
  }

  private initialiseAppObservables() {
    this.apps$ = this.org$.pipe(
      switchMap(org => this.cfEndpointService.getAppsInOrgViaAllApps(org.entity))
    );
    this.appInstances$ = this.apps$.pipe(
      filter($apps => !!$apps),
      map(getStartedAppInstanceCount)
    );

    this.totalMem$ = this.apps$.pipe(map(a => this.cfEndpointService.getMetricFromApps(a, 'memory')));

    this.appCount$ = this.cfEndpointService.appsPagObs.hasEntities$.pipe(
      switchMap(hasAllApps => hasAllApps ? this.countExistingApps() : this.fetchAppCount()),
    );

    this.loadingApps$ = this.cfEndpointService.appsPagObs.fetchingEntities$;

    this.usersCount$ = this.cfUserService.fetchTotalUsers(this.cfGuid, this.orgGuid);
  }

  private countExistingApps(): Observable<number> {
    return this.apps$.pipe(
      map(apps => apps.length)
    );
  }

  private fetchAppCount(): Observable<number> {
    return CloudFoundryEndpointService.fetchAppCount(
      this.store,
      this.paginationMonitorFactory,
      this.activeRouteCfOrgSpace.cfGuid,
      this.activeRouteCfOrgSpace.orgGuid
    );
  }

  private initialiseOrgObservables() {
    this.spaces$ = this.org$.pipe(map(o => o.entity.entity.spaces), filter(o => !!o));
    this.privateDomains$ = this.org$.pipe(map(o => o.entity.entity.private_domains));
    this.quotaDefinition$ = this.org$.pipe(map(o => o.entity.entity.quota_definition && o.entity.entity.quota_definition.entity));
    this.quotaLink$ = this.org$.pipe(map(o => {
      const quotaDefinition = o.entity.entity.quota_definition;

      return quotaDefinition && [
        '/cloud-foundry',
        this.cfGuid,
        'quota-definitions',
        quotaDefinition.metadata.guid
      ];
    }));
  }

  private getFlattenedList(property: string): (source: Observable<APIResource<any>[]>) => Observable<any> {
    return map(entities => getEntityFlattenedList(property, entities));
  }
}
