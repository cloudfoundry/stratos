import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  routeEntityType,
  serviceBindingEntityType,
  serviceInstancesEntityType,
  spaceEntityType,
  spaceQuotaEntityType,
} from '../../../../../cloud-foundry/src/cf-entity-types';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { IApp, IOrgQuotaDefinition, IRoute, ISpace, ISpaceQuotaDefinition } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { getStartedAppInstanceCount } from '../../../cf.helpers';
import { createEntityRelationKey } from '../../../entity-relations/entity-relations.types';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import { fetchServiceInstancesCount } from '../../service-catalog/services-helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getSpaceRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService, createOrgQuotaDefinition } from './cloud-foundry-organization.service';

@Injectable()
export class CloudFoundrySpaceService {

  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  userRole$: Observable<string>;
  /**
   * Sensible quota to use for space. If there's no specific space quota set this will be the org quota. If there's no org quota
   * a mock quota with everything allowed will be used
   */
  quotaDefinition$: Observable<ISpaceQuotaDefinition | IOrgQuotaDefinition>;
  /**
   * Actual Space Quota. In almost all cases `quotaDefinition$` should be used instead
   */
  spaceQuotaDefinition$: Observable<ISpaceQuotaDefinition>;
  allowSsh$: Observable<string>;
  totalMem$: Observable<number>;
  routes$: Observable<APIResource<IRoute>[]>;
  serviceInstancesCount$: Observable<number>;
  userProvidedServiceInstancesCount$: Observable<number>;
  appInstances$: Observable<number>;
  apps$: Observable<APIResource<IApp>[]>;
  appCount$: Observable<number>;
  loadingApps$: Observable<boolean>;
  space$: Observable<EntityInfo<APIResource<ISpace>>>;
  usersCount$: Observable<number | null>;
  quotaLink$: Observable<string[]>;

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<CFAppState>,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfEndpointService: CloudFoundryEndpointService,
    private cfUserProvidedServicesService: CloudFoundryUserProvidedServicesService,
    private cfOrgService: CloudFoundryOrganizationService
  ) {

    this.spaceGuid = activeRouteCfOrgSpace.spaceGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;

    this.initialiseObservables();
  }

  public fetchApps() {
    this.cfEndpointService.fetchApps();
  }

  private initialiseObservables() {
    this.initialiseSpaceObservables();
    this.initialiseAppObservables();

    this.userRole$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => {
        return this.cfUserService.getUserRoleInSpace(
          u.guid,
          this.spaceGuid,
          this.cfGuid
        );
      }),
      map(u => getSpaceRolesString(u))
    );

    this.usersCount$ = this.cfUserService.fetchTotalUsers(this.cfGuid, this.orgGuid, this.spaceGuid);
  }

  private initialiseSpaceObservables() {
    this.space$ = this.cfUserService.isConnectedUserAdmin(this.cfGuid).pipe(
      switchMap(isAdmin => {
        const relations = [
          createEntityRelationKey(spaceEntityType, spaceQuotaEntityType),
          createEntityRelationKey(serviceInstancesEntityType, serviceBindingEntityType),
          createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
          createEntityRelationKey(spaceEntityType, routeEntityType),
        ];
        if (!isAdmin) {
          // We're only interested in fetching space roles via the space request for non-admins.
          // Non-admins cannot fetch missing roles via the users entity as the `<x>_url` is invalid
          // #2902 Scaling Orgs/Spaces Inline --> individual capped requests & handling
          relations.push(
            createEntityRelationKey(spaceEntityType, SpaceUserRoleNames.DEVELOPER),
            createEntityRelationKey(spaceEntityType, SpaceUserRoleNames.MANAGER),
            createEntityRelationKey(spaceEntityType, SpaceUserRoleNames.AUDITOR),
          );
        }
        return cfEntityCatalog.space.store.getEntityService(this.spaceGuid, this.cfGuid, { includeRelations: relations })
          .entityObs$.pipe(filter(o => !!o && !!o.entity));
      }),
      publishReplay(1),
      refCount()
    );

    this.serviceInstancesCount$ = fetchServiceInstancesCount(
      this.cfGuid,
      this.orgGuid,
      this.spaceGuid,
      this.store,
      this.paginationMonitorFactory);
    this.userProvidedServiceInstancesCount$ =
      this.cfUserProvidedServicesService.fetchUserProvidedServiceInstancesCount(this.cfGuid, this.orgGuid, this.spaceGuid);
    this.routes$ = this.space$.pipe(map(o => o.entity.entity.routes));
    this.allowSsh$ = this.space$.pipe(map(o => o.entity.entity.allow_ssh ? 'true' : 'false'));
    this.spaceQuotaDefinition$ = this.space$.pipe(
      map(q => q.entity.entity.space_quota_definition ? q.entity.entity.space_quota_definition.entity : null)
    );
    this.quotaDefinition$ = this.spaceQuotaDefinition$.pipe(
      switchMap(def => def ? of(def) : this.cfOrgService.quotaDefinition$),
      map(def => def ?
        {
          ...def,
          organization_guid: this.orgGuid,
        } :
        createOrgQuotaDefinition()
      )
    );
    this.quotaLink$ = combineLatest(this.quotaDefinition$, this.spaceQuotaDefinition$).pipe(
      map(([quota, spaceQuota]) => {
        if (!spaceQuota) {
          return [
            '/cloud-foundry',
            this.cfGuid,
            'organizations',
            this.orgGuid,
            'quota',
          ];
        }

        return quota && [
          '/cloud-foundry',
          this.cfGuid,
          'organizations',
          this.orgGuid,
          'spaces',
          this.spaceGuid,
          'space-quota'
        ];
      }
      )
    );
  }

  private initialiseAppObservables() {
    this.apps$ = this.space$.pipe(
      switchMap(space => this.cfEndpointService.getAppsInSpaceViaAllApps(space.entity))
    );

    this.appInstances$ = this.apps$.pipe(
      map(getStartedAppInstanceCount)
    );

    this.totalMem$ = this.apps$.pipe(
      map(a => this.cfEndpointService.getMetricFromApps(a, 'memory'))
    );

    this.appCount$ = this.cfEndpointService.appsPagObs.hasEntities$.pipe(
      switchMap(hasAllApps => hasAllApps ? this.countExistingApps() : this.fetchAppCount()),
    );

    this.loadingApps$ = this.cfEndpointService.appsPagObs.fetchingEntities$;
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
      this.activeRouteCfOrgSpace.orgGuid,
      this.activeRouteCfOrgSpace.spaceGuid
    );
  }
}
