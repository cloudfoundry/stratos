import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  spaceEntityType,
} from '../../../../../cloud-foundry/src/cf-entity-types';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import {
  IApp,
  IOrganization,
  IOrgQuotaDefinition,
  IPrivateDomain,
  ISpace,
  ISpaceQuotaDefinition,
} from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { getEntityFlattenedList, getStartedAppInstanceCount } from '../../../cf.helpers';
import { createEntityRelationKey } from '../../../entity-relations/entity-relations.types';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { OrgUserRoleNames } from '../../../store/types/cf-user.types';
import { fetchServiceInstancesCount } from '../../service-catalog/services-helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getOrgRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

export const createOrgQuotaDefinition = (): IOrgQuotaDefinition => ({
  memory_limit: -1,
  app_instance_limit: -1,
  instance_memory_limit: -1,
  name: 'None assigned',
  total_services: -1,
  total_routes: -1,
  app_task_limit: -1,
  total_reserved_route_ports: -1,
  total_service_keys: -1,
  trial_db_allowed: false
});

export const createSpaceQuotaDefinition = (orgGuid: string): ISpaceQuotaDefinition => ({
  memory_limit: -1,
  app_instance_limit: -1,
  instance_memory_limit: -1,
  name: 'None assigned',
  total_services: -1,
  total_routes: -1,
  app_task_limit: -1,
  total_reserved_route_ports: -1,
  total_service_keys: -1,
  organization_guid: orgGuid
});

@Injectable()
export class CloudFoundryOrganizationService {
  orgGuid: string;
  cfGuid: string;
  quotaLink$: Observable<string[]>;
  userOrgRole$: Observable<string>;
  quotaDefinition$: Observable<IOrgQuotaDefinition>;
  totalMem$: Observable<number>;
  privateDomains$: Observable<APIResource<IPrivateDomain>[]>;
  routes$: Observable<APIResource<Route>[]>;
  serviceInstancesCount$: Observable<number>;
  userProvidedServiceInstancesCount$: Observable<number>;
  routesCount$: Observable<number>;
  spaces$: Observable<APIResource<ISpace>[]>;
  appInstances$: Observable<number>;
  apps$: Observable<APIResource<IApp>[]>;
  appCount$: Observable<number>;
  loadingApps$: Observable<boolean>;
  org$: Observable<EntityInfo<APIResource<IOrganization>>>;
  usersCount$: Observable<number | null>;

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<CFAppState>,
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
    cfEntityCatalog.space.api.remove(spaceGuid, endpointGuid, { orgGuid })
  }

  public fetchApps() {
    this.cfEndpointService.fetchApps();
  }

  private initialiseObservables() {
    this.org$ = this.cfUserService.isConnectedUserAdmin(this.cfGuid).pipe(
      switchMap(isAdmin => {
        const relations = [
          createEntityRelationKey(organizationEntityType, spaceEntityType),
          createEntityRelationKey(organizationEntityType, domainEntityType),
          createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType),
          createEntityRelationKey(organizationEntityType, privateDomainsEntityType),
        ];
        if (!isAdmin) {
          // We're only interested in fetching org roles via the org request for non-admins.
          // Non-admins cannot fetch missing roles via the users entity as the `<x>_url` is invalid
          // #2902 Scaling Orgs/Spaces Inline --> individual capped requests & handling
          relations.push(
            createEntityRelationKey(organizationEntityType, OrgUserRoleNames.USER),
            createEntityRelationKey(organizationEntityType, OrgUserRoleNames.MANAGER),
            createEntityRelationKey(organizationEntityType, OrgUserRoleNames.BILLING_MANAGERS),
            createEntityRelationKey(organizationEntityType, OrgUserRoleNames.AUDITOR),
          );
        }
        return cfEntityCatalog.org.store.getEntityService(this.orgGuid, this.cfGuid, { includeRelations: relations }).waitForEntity$;
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

    this.routesCount$ = CloudFoundryEndpointService.fetchRouteCount(
      this.store,
      this.paginationMonitorFactory,
      this.activeRouteCfOrgSpace.cfGuid,
      this.activeRouteCfOrgSpace.orgGuid
    );
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
        'organizations',
        this.orgGuid,
        'quota'
      ];
    }));
  }

  private getFlattenedList(property: string): (source: Observable<APIResource<any>[]>) => Observable<any> {
    return map(entities => getEntityFlattenedList(property, entities));
  }
}
