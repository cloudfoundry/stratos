import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, shareReplay } from 'rxjs/operators';

import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { ApplicationSchema, GetAllApplications } from '../../../store/actions/application.actions';
import { CF_INFO_ENTITY_KEY, CFInfoSchema, GetEndpointInfo } from '../../../store/actions/cloud-foundry.actions';
import { EndpointSchema, GetAllEndpoints } from '../../../store/actions/endpoint.actions';
import { AppState } from '../../../store/app-state';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfApplication, CfApplicationState } from '../../../store/types/application.types';
import { EndpointModel, EndpointUser } from '../../../store/types/endpoint.types';
import { CfOrg } from '../../../store/types/org-and-space.types';
import { CfUser } from '../../../store/types/user.types';

@Injectable()
export class CloudFoundryEndpointService {
  allApps$: PaginationObservables<APIResource<any>>;
  users$: Observable<APIResource<CfUser>[]>;
  orgs$: Observable<APIResource[]>;
  info$: Observable<EntityInfo<any>>;
  cfInfoEntityService: EntityService<any>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  cfEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;

  public allAppsAction = new GetAllApplications('applicationWall');

  constructor(
    public cfGuid: string,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfOrgSpaceDataService: CfOrgSpaceDataService,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.cfEndpointEntityService = this.entityServiceFactory.create(
      EndpointSchema.key,
      EndpointSchema,
      cfGuid,
      new GetAllEndpoints()
    );

    this.cfInfoEntityService = this.entityServiceFactory.create(
      CF_INFO_ENTITY_KEY,
      CFInfoSchema,
      this.cfGuid,
      new GetEndpointInfo(this.cfGuid)
    );
    this.constructCoreObservables();
  }

  constructCoreObservables() {
    this.endpoint$ = this.cfEndpointEntityService.waitForEntity$;

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.orgs$ = this.cfOrgSpaceDataService.getEndpointOrgs(this.cfGuid);

    this.users$ = this.cfUserService.getUsers(this.cfGuid);

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user));

    this.info$ = this.cfInfoEntityService.waitForEntity$.pipe(shareReplay(1));

    this.allApps$ = getPaginationObservables<APIResource<CfApplication>>({
      store: this.store,
      action: this.allAppsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.allAppsAction.paginationKey,
        ApplicationSchema
      )
    });
  }

  spaceInOrg = (app: APIResource<any>, org: APIResource<CfOrg>): any =>
    org.entity.spaces.indexOf(app.entity.space_guid) !== -1

  getAppsOrg = (
    org: APIResource<CfOrg>
  ): Observable<APIResource<CfApplication>[]> =>
    this.allApps$.entities$.pipe(
      map(apps => apps.filter(a => this.spaceInOrg(a, org)))
    )

  getAggregateStat(
    org: APIResource<CfOrg>,
    statMetric: string
  ): Observable<number> {
    return this.getAppsOrg(org).pipe(
      map(apps =>
        apps
          .filter(a => a.entity.state !== CfApplicationState.STOPPED)
          .map(a => a.entity[statMetric])
      ),
      map(p => p.reduce((a, t) => a + t, 0))
    );
  }
}
