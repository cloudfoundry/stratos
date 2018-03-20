import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { first, map, shareReplay } from 'rxjs/operators';

import { IApp, ICfV2Info, IOrganization, ISpace } from '../../../core/cf-api.types';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetCFInfo } from '../../../store/actions/cloud-foundry.actions';
import { FetchAllDomains } from '../../../store/actions/domains.actions';
import { GetAllEndpoints } from '../../../store/actions/endpoint.actions';
import { GetAllOrganizations } from '../../../store/actions/organization.actions';
import { AppState } from '../../../store/app-state';
import {
  applicationSchemaKey,
  cfInfoSchemaKey,
  domainSchemaKey,
  endpointSchemaKey,
  entityFactory,
  organizationSchemaKey,
  quotaDefinitionSchemaKey,
  serviceInstancesSchemaKey,
  spaceSchemaKey,
} from '../../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfApplicationState } from '../../../store/types/application.types';
import { EndpointModel, EndpointUser } from '../../../store/types/endpoint.types';
import { CfUser } from '../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

@Injectable()
export class CloudFoundryEndpointService {

  hasSSHAccess$: Observable<boolean>;
  totalMem$: Observable<number>;
  paginationSubscription: any;
  allApps$: Observable<APIResource<IApp>[]>;
  users$: Observable<APIResource<CfUser>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;
  info$: Observable<EntityInfo<APIResource<ICfV2Info>>>;
  cfInfoEntityService: EntityService<APIResource<ICfV2Info>>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  cfEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  cfGuid: string;

  getAllOrgsAction: GetAllOrganizations;

  static createGetAllOrganizations(cfGuid: string) {
    const paginationKey = cfGuid ?
      createEntityRelationPaginationKey(endpointSchemaKey, cfGuid)
      : createEntityRelationPaginationKey(endpointSchemaKey, 'all');
    return new GetAllOrganizations(
      paginationKey,
      cfGuid, [
        createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
        createEntityRelationKey(organizationSchemaKey, quotaDefinitionSchemaKey),
        createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
        createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
      ]);
  }

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);

    this.cfEndpointEntityService = this.entityServiceFactory.create(
      endpointSchemaKey,
      entityFactory(endpointSchemaKey),
      this.cfGuid,
      new GetAllEndpoints(),
      false
    );

    this.cfInfoEntityService = this.entityServiceFactory.create<APIResource<ICfV2Info>>(
      cfInfoSchemaKey,
      entityFactory(cfInfoSchemaKey),
      this.cfGuid,
      new GetCFInfo(this.cfGuid),
      false
    );
    this.constructCoreObservables();
    this.constructSecondaryObservable();

  }

  constructCoreObservables() {
    this.endpoint$ = this.cfEndpointEntityService.waitForEntity$;

    this.orgs$ = getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: this.getAllOrgsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.getAllOrgsAction.paginationKey,
        entityFactory(organizationSchemaKey)
      )
    }, true).entities$;

    this.users$ = this.cfUserService.getUsers(this.cfGuid);

    this.info$ = this.cfInfoEntityService.waitForEntity$;

    this.allApps$ = this.orgs$.pipe(
      map(p => {
        return p
          .filter(o => !!o.entity.spaces)
          .map(o => {
            return o.entity.spaces.map(space => space.entity.apps || []);
          });
      }),
      map(a => {
        let flatArray = [];
        a.forEach(
          appsInSpace => (flatArray = flatArray.concat(...appsInSpace))
        );
        return flatArray;
      })
    );

    this.fetchDomains();
  }

  constructSecondaryObservable() {

    this.hasSSHAccess$ = this.info$.pipe(
      map(p => !!(p.entity.entity &&
        p.entity.entity.app_ssh_endpoint &&
        p.entity.entity.app_ssh_host_key_fingerprint &&
        p.entity.entity.app_ssh_oauth_client))
    );
    this.totalMem$ = this.allApps$.pipe(map(a => this.getMetricFromApps(a, 'memory')));

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), first(), shareReplay(1));

  }

  getAppsInOrg(
    org: APIResource<IOrganization>
  ): Observable<APIResource<IApp>[]> {
    return this.allApps$.pipe(
      map(allApps => {
        const orgSpaces = org.entity.spaces.map(s => s.metadata.guid);
        return allApps.filter(a => orgSpaces.indexOf(a.entity.space_guid) !== -1);
      })
    );
  }

  getAppsInSpace(
    space: APIResource<ISpace>
  ): Observable<APIResource<IApp>[]> {
    return this.allApps$.pipe(
      map(apps => {
        return apps.filter(a => a.entity.space_guid === space.metadata.guid);
      })
    );
  }

  getAggregateStat(
    org: APIResource<IOrganization>,
    statMetric: string
  ): Observable<number> {
    return this.getAppsInOrg(org).pipe(
      map(apps => this.getMetricFromApps(apps, statMetric))
    );
  }
  public getMetricFromApps(
    apps: APIResource<IApp>[],
    statMetric: string
  ): number {
    return apps ? apps
      .filter(a => a.entity.state !== CfApplicationState.STOPPED)
      .map(a => a.entity[statMetric] * a.entity.instances)
      .reduce((a, t) => a + t, 0) : 0;
  }

  fetchDomains = () => {
    const action = new FetchAllDomains(this.cfGuid);
    this.paginationSubscription = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(domainSchemaKey)
        )
      },
      true
    ).entities$.subscribe();
  }
}
