import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { IServiceInstance } from '../../../core/cf-api-svc.types';
import { IApp, IQuotaDefinition, IRoute, ISpace } from '../../../core/cf-api.types';
import { getStartedAppInstanceCount } from '../../../core/cf.helpers';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  routeSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { SpaceUserRoleNames } from '../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getSpaceRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { createQuotaDefinition } from './cloud-foundry-organization.service';

@Injectable()
export class CloudFoundrySpaceService {

  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  userRole$: Observable<string>;
  quotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  allowSsh$: Observable<string>;
  totalMem$: Observable<number>;
  routes$: Observable<APIResource<IRoute>[]>;
  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  appInstances$: Observable<number>;
  apps$: Observable<APIResource<IApp>[]>;
  appCount$: Observable<number>;
  loadingApps$: Observable<boolean>;
  space$: Observable<EntityInfo<APIResource<ISpace>>>;
  usersCount$: Observable<number | null>;

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfEndpointService: CloudFoundryEndpointService,
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
          createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
          createEntityRelationKey(spaceSchemaKey, spaceQuotaSchemaKey),
          createEntityRelationKey(serviceInstancesSchemaKey, serviceBindingSchemaKey),
          createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey),
          createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
        ];
        if (!isAdmin) {
          // We're only interested in fetching space roles via the space request for non-admins.
          // Non-admins cannot fetch missing roles via the users entity as the `<x>_url` is invalid
          // #2902 Scaling Orgs/Spaces Inline --> individual capped requests & handling
          relations.push(
            createEntityRelationKey(spaceSchemaKey, SpaceUserRoleNames.DEVELOPER),
            createEntityRelationKey(spaceSchemaKey, SpaceUserRoleNames.MANAGER),
            createEntityRelationKey(spaceSchemaKey, SpaceUserRoleNames.AUDITOR),
          );
        }
        const spaceEntityService = this.entityServiceFactory.create<APIResource<ISpace>>(
          spaceSchemaKey,
          entityFactory(spaceWithOrgKey),
          this.spaceGuid,
          new GetSpace(this.spaceGuid, this.cfGuid, relations),
          true
        );
        return spaceEntityService.entityObs$.pipe(filter(o => !!o && !!o.entity));
      }),
      publishReplay(1),
      refCount()
    );

    this.serviceInstances$ = this.space$.pipe(map(o => o.entity.entity.service_instances));
    this.routes$ = this.space$.pipe(map(o => o.entity.entity.routes));
    this.allowSsh$ = this.space$.pipe(map(o => o.entity.entity.allow_ssh ? 'true' : 'false'));
    this.quotaDefinition$ = this.space$.pipe(map(q => {
      if (q.entity.entity.space_quota_definition) {
        return q.entity.entity.space_quota_definition;
      } else {
        return createQuotaDefinition(this.orgGuid);
      }
    }));
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
