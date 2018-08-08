import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { IServiceInstance } from '../../../core/cf-api-svc.types';
import { IApp, IQuotaDefinition, IRoute, ISpace } from '../../../core/cf-api.types';
import { getStartedAppInstanceCount } from '../../../core/cf.helpers';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAllSpaceUsers, GetSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import {
  applicationSchemaKey,
  cfUserSchemaKey,
  entityFactory,
  routeSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfUser } from '../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getSpaceRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

const noQuotaDefinition = (orgGuid: string) => ({
  entity: {
    memory_limit: -1,
    app_instance_limit: -1,
    instance_memory_limit: -1,
    name: 'None assigned',
    organization_guid: orgGuid,
    total_services: -1,
    total_routes: -1
  },
  metadata: null
});

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
  space$: Observable<EntityInfo<APIResource<ISpace>>>;
  spaceEntityService: EntityService<APIResource<ISpace>>;
  allSpaceUsers: PaginationObservables<APIResource<CfUser>>;
  allSpaceUsersAction: GetAllSpaceUsers;
  usersPaginationKey: string;

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfEndpointService: CloudFoundryEndpointService

  ) {

    this.spaceGuid = activeRouteCfOrgSpace.spaceGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.usersPaginationKey = createEntityRelationPaginationKey(spaceSchemaKey, activeRouteCfOrgSpace.spaceGuid);
    this.allSpaceUsersAction = new GetAllSpaceUsers(
      activeRouteCfOrgSpace.spaceGuid,
      this.usersPaginationKey,
      activeRouteCfOrgSpace.cfGuid
    );
    this.spaceEntityService = this.entityServiceFactory.create(
      spaceSchemaKey,
      entityFactory(spaceWithOrgKey),
      this.spaceGuid,
      new GetSpace(this.spaceGuid, this.cfGuid, [
        createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
        createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
        createEntityRelationKey(spaceSchemaKey, spaceQuotaSchemaKey),
        createEntityRelationKey(serviceInstancesSchemaKey, serviceBindingSchemaKey),
        createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey),
        createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
        createEntityRelationKey(routeSchemaKey, applicationSchemaKey),
      ]),
      true
    );

    this.initialiseObservables();

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

  }

  private initialiseSpaceObservables() {
    this.space$ = this.spaceEntityService.waitForEntity$.pipe(filter(o => !!o && !!o.entity));
    this.serviceInstances$ = this.space$.pipe(map(o => o.entity.entity.service_instances));
    this.routes$ = this.space$.pipe(map(o => o.entity.entity.routes));
    this.allowSsh$ = this.space$.pipe(map(o => o.entity.entity.allow_ssh ? 'true' : 'false'));
    this.quotaDefinition$ = this.space$.pipe(map(q => {
      if (q.entity.entity.space_quota_definition) {
        return q.entity.entity.space_quota_definition;
      } else {
        return noQuotaDefinition(this.orgGuid);
      }
    }));
    this.allSpaceUsers = getPaginationObservables({
      store: this.store,
      action: this.allSpaceUsersAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.usersPaginationKey,
        entityFactory(cfUserSchemaKey)
      )
    });
  }

  private initialiseAppObservables() {
    this.apps$ = this.space$.pipe(
      map(s => {
        return s.entity.entity.apps;
      }),
      filter(apps => !!apps)
    );

    this.appInstances$ = this.apps$.pipe(
      map(getStartedAppInstanceCount)
    );

    this.totalMem$ = this.apps$.pipe(
      map(a => this.cfEndpointService.getMetricFromApps(a, 'memory'))
    );


  }
}
