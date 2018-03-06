import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, shareReplay } from 'rxjs/operators';

import { IInfo } from '../../../core/cf-api.types';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { CF_INFO_ENTITY_KEY, CFInfoSchema, GetEndpointInfo } from '../../../store/actions/cloud-foundry.actions';
import { DomainSchema, FetchAllDomains } from '../../../store/actions/domains.actions';
import { EndpointSchema, GetAllEndpoints } from '../../../store/actions/endpoint.actions';
import { AppState } from '../../../store/app-state';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfApplicationState } from '../../../store/types/application.types';
import { EndpointModel, EndpointUser } from '../../../store/types/endpoint.types';
import { CfUser } from '../../../store/types/user.types';
import { BaseCF } from '../cf-page.types';
import { IOrganization, ISpace, IApp } from '../../../core/cf-api.types';
@Injectable()
export class CloudFoundryEndpointService {
  hasSSHAccess$: Observable<boolean>;
  totalMem$: Observable<number>;
  paginationSubscription: any;
  allApps$: Observable<APIResource<IApp>[]>;
  users$: Observable<APIResource<CfUser>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;
  info$: Observable<EntityInfo<APIResource<IInfo>>>;
  cfInfoEntityService: EntityService<APIResource<IInfo>>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  cfEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  cfGuid: string;

  constructor(
    public baseCf: BaseCF,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfOrgSpaceDataService: CfOrgSpaceDataService,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.cfGuid = baseCf.guid;
    this.cfEndpointEntityService = this.entityServiceFactory.create(
      EndpointSchema.key,
      EndpointSchema,
      this.cfGuid,
      new GetAllEndpoints()
    );

    this.cfInfoEntityService = this.entityServiceFactory.create<APIResource<IInfo>>(
      CF_INFO_ENTITY_KEY,
      CFInfoSchema,
      this.cfGuid,
      new GetEndpointInfo(this.cfGuid)
    );
    this.constructCoreObservables();
    this.constructSecondaryObservable();
  }

  constructCoreObservables() {
    this.endpoint$ = this.cfEndpointEntityService.waitForEntity$;

    this.orgs$ = this.cfOrgSpaceDataService.getEndpointOrgs(this.cfGuid);

    this.users$ = this.cfUserService.getUsers(this.cfGuid);

    this.info$ = this.cfInfoEntityService.waitForEntity$;

    this.allApps$ = this.orgs$.pipe(
      // This should go away once https://github.com/cloudfoundry-incubator/stratos/issues/1619 is fixed
      map(orgs => orgs.filter(org => org.entity.spaces)),
      map(p => {
        return p.map(o => o.entity.spaces.map(space => space.entity.apps));
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

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), shareReplay(1));

  }

  getAppsInOrg(
    org: APIResource<IOrganization>
  ): Observable<APIResource<IApp>[]> {
    // This should go away once https://github.com/cloudfoundry-incubator/stratos/issues/1619 is fixed
    if (!org.entity.spaces) {
      return Observable.of([]);
    }
    return this.allApps$.pipe(
      map(apps => {
        const orgSpaces = org.entity.spaces.map(s => s.metadata.guid);
        return apps.filter(a => orgSpaces.indexOf(a.entity.space_guid) !== -1);
      })
    );
  }

  getAppsInSpace(
    space: APIResource<ISpace>
  ): Observable<APIResource<IApp>[]> {
    return this.allApps$.pipe(
      map(apps => {
        return apps.filter(a => a.entity.space_guid === space.entity.guid);
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
          DomainSchema
        )
      },
      true
    ).entities$.subscribe();
  }
}
