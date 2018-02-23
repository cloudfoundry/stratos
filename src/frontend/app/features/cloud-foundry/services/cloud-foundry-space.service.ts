import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, switchMap } from 'rxjs/operators';

import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { spaceSchemaKey, SpaceWithOrganisationSchema } from '../../../store/actions/action-types';
import { GetSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfApplication } from '../../../store/types/application.types';
import { CfQuotaDefinition, CfSpace } from '../../../store/types/org-and-space.types';
import { Route } from '../../../store/types/route.types';
import { getSpaceRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CfServiceInstance } from '../../../store/types/service.types';

@Injectable()
export class CloudFoundrySpaceService {

  userRole$: Observable<string>;
  quotaDefinition$: Observable<APIResource<CfQuotaDefinition>>;
  allowSsh$: Observable<string>;
  totalMem$: Observable<number>;
  routes$: Observable<APIResource<Route>[]>;
  serviceInstances$: Observable<APIResource<CfServiceInstance>[]>;
  appInstances$: Observable<number>;
  apps$: Observable<APIResource<CfApplication>[]>;
  space$: Observable<EntityInfo<APIResource<CfSpace>>>;
  spaceEntitySchema: EntityService<APIResource<CfSpace>>;
  constructor(
    public cfGuid: string,
    public orgGuid: string,
    public spaceGuid: string,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfEndpointService: CloudFoundryEndpointService

  ) {

    this.spaceEntitySchema = this.entityServiceFactory.create(
      spaceSchemaKey,
      SpaceWithOrganisationSchema,
      spaceGuid,
      new GetSpace(spaceGuid, cfGuid, 2)
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
    this.space$ = this.spaceEntitySchema.entityObs$.pipe(filter(o => !!o && !!o.entity));
    this.serviceInstances$ = this.space$.pipe(map(o => o.entity.entity.service_instances));
    this.routes$ = this.space$.pipe(map(o => o.entity.entity.routes));
    this.allowSsh$ = this.space$.pipe(map(o => o.entity.entity.allow_ssh ? 'true' : 'false'));
    this.quotaDefinition$ = this.space$.pipe(map(q => {
      if (q.entity.entity.space_quota_definition) {
        return q.entity.entity.space_quota_definition;
      } else {
        return {
          entity: {
            memory_limit: -1,
            app_instance_limit: -1,
            instance_memory_limit: -1,
            name: 'None assigned',
            organization_guid: this.orgGuid,
            total_services: -1,
            total_routes: -1
          },
          metadata: null
        };
      }
    }));
  }

  private initialiseAppObservables() {
    this.apps$ = this.space$.pipe(
      map(s => s.entity.entity.apps)
    );

    this.appInstances$ = this.apps$.pipe(map(a => a
      .map(app => app.entity.instances)
      .reduce((i, x) => i + x, 0)));

    this.totalMem$ = this.apps$.pipe(
      map(a => this.cfEndpointService.getMetricFromApps(a, 'memory'))
    );


  }
}
