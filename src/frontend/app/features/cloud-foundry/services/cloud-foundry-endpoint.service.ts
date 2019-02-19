import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount } from 'rxjs/operators';

import { IApp, ICfV2Info, IOrganization, ISpace } from '../../../core/cf-api.types';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAllApplications } from '../../../store/actions/application.actions';
import { GetCFInfo } from '../../../store/actions/cloud-foundry.actions';
import { FetchAllDomains } from '../../../store/actions/domains.actions';
import { GetAllEndpoints } from '../../../store/actions/endpoint.actions';
import { DeleteOrganization, GetAllOrganizations } from '../../../store/actions/organization.actions';
import { AppState } from '../../../store/app-state';
import {
  cfInfoSchemaKey,
  domainSchemaKey,
  endpointSchemaKey,
  entityFactory,
  organizationSchemaKey,
  privateDomainsSchemaKey,
  quotaDefinitionSchemaKey,
  routeSchemaKey,
  serviceInstancesSchemaKey,
  spaceSchemaKey,
} from '../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../store/helpers/entity-relations/entity-relations.types';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfApplicationState } from '../../../store/types/application.types';
import { EndpointModel, EndpointUser } from '../../../store/types/endpoint.types';
import { QParam } from '../../../store/types/pagination.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { fetchTotalResults } from '../cf.helpers';

export function appDataSort(app1: APIResource<IApp>, app2: APIResource<IApp>): number {
  const app1Date = new Date(app1.metadata.updated_at);
  const app2Date = new Date(app2.metadata.updated_at);
  if (app1Date > app2Date) {
    return -1;
  }
  if (app1Date < app2Date) {
    return 1;
  }
  return 0;
}


@Injectable()
export class CloudFoundryEndpointService {

  hasSSHAccess$: Observable<boolean>;
  totalMem$: Observable<number>;
  paginationSubscription: any;
  appsPagObs: PaginationObservables<APIResource<IApp>>;
  usersCount$: Observable<number | null>;
  orgs$: Observable<APIResource<IOrganization>[]>;
  info$: Observable<EntityInfo<APIResource<ICfV2Info>>>;
  cfInfoEntityService: EntityService<APIResource<ICfV2Info>>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  cfEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  cfGuid: string;

  getAllOrgsAction: GetAllOrganizations;

  private getAllAppsAction: GetAllApplications;

  static createGetAllOrganizations(cfGuid: string) {
    const paginationKey = cfGuid ?
      createEntityRelationPaginationKey(endpointSchemaKey, cfGuid)
      : createEntityRelationPaginationKey(endpointSchemaKey);
    return new GetAllOrganizations(
      paginationKey,
      cfGuid, [
        createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
        createEntityRelationKey(organizationSchemaKey, domainSchemaKey),
        createEntityRelationKey(organizationSchemaKey, quotaDefinitionSchemaKey),
        createEntityRelationKey(organizationSchemaKey, privateDomainsSchemaKey),
        createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
        createEntityRelationKey(spaceSchemaKey, routeSchemaKey), // Not really needed at top level, but if we drop down into an org with
        // lots of spaces it saves n x routes requests
      ]);
  }
  static createGetAllOrganizationsLimitedSchema(cfGuid: string) {
    const paginationKey = cfGuid ?
      createEntityRelationPaginationKey(endpointSchemaKey, cfGuid)
      : createEntityRelationPaginationKey(endpointSchemaKey);
    return new GetAllOrganizations(
      paginationKey,
      cfGuid, [
        createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
      ]);
  }

  public static fetchAppCount(store: Store<AppState>, pmf: PaginationMonitorFactory, cfGuid: string, orgGuid?: string, spaceGuid?: string)
    : Observable<number> {
    const parentSchemaKey = spaceGuid ? spaceSchemaKey : orgGuid ? organizationSchemaKey : 'cf';
    const uniqueKey = spaceGuid || orgGuid || cfGuid;
    const action = new GetAllApplications(createEntityRelationPaginationKey(parentSchemaKey, uniqueKey), cfGuid);
    action.initialParams = {
      q: []
    };
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, ' IN '));
    }
    if (spaceGuid) {
      action.initialParams.q.push(new QParam('space_guid', spaceGuid, ' IN '));
    }
    return fetchTotalResults(action, store, pmf);
  }

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private pmf: PaginationMonitorFactory
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);
    this.getAllAppsAction = new GetAllApplications(createEntityRelationPaginationKey('cf', this.cfGuid), this.cfGuid);

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

  private constructCoreObservables() {
    this.endpoint$ = this.cfEndpointEntityService.waitForEntity$;

    this.orgs$ = getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: this.getAllOrgsAction,
      paginationMonitor: this.pmf.create(
        this.getAllOrgsAction.paginationKey,
        entityFactory(organizationSchemaKey)
      )
    }, true).entities$;

    this.info$ = this.cfInfoEntityService.waitForEntity$;

    this.usersCount$ = this.cfUserService.fetchTotalUsers(this.cfGuid);

    this.constructAppObs();

    this.fetchDomains();
  }

  constructAppObs() {
    const appPaginationMonitor = this.pmf.create(this.getAllAppsAction.paginationKey, entityFactory(this.getAllAppsAction.entityKey));
    this.appsPagObs = getPaginationObservables<APIResource<IApp>>({
      store: this.store,
      action: this.getAllAppsAction,
      paginationMonitor: appPaginationMonitor
    });
  }

  private constructSecondaryObservable() {
    this.hasSSHAccess$ = this.info$.pipe(
      map(p => !!(p.entity.entity &&
        p.entity.entity.app_ssh_endpoint &&
        p.entity.entity.app_ssh_host_key_fingerprint &&
        p.entity.entity.app_ssh_oauth_client))
    );
    this.totalMem$ = this.appsPagObs.entities$.pipe(map(apps => this.getMetricFromApps(apps, 'memory')));

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), first(), publishReplay(1), refCount());
  }

  public getAppsInOrgViaAllApps(org: APIResource<IOrganization>): Observable<APIResource<IApp>[]> {
    return this.appsPagObs.entities$.pipe(
      filter(allApps => !!allApps),
      map(allApps => {
        const spaces = org.entity.spaces || [];
        const orgSpaces = spaces.map(s => s.metadata.guid);
        return allApps.filter(a => orgSpaces.indexOf(a.entity.space_guid) !== -1);
      })
    );
  }

  public getAppsInSpaceViaAllApps(space: APIResource<ISpace>): Observable<APIResource<IApp>[]> {
    return this.appsPagObs.entities$.pipe(
      filter(allApps => !!allApps),
      map(apps => {
        return apps.filter(a => a.entity.space_guid === space.metadata.guid);
      })
    );
  }

  public getMetricFromApps(apps: APIResource<IApp>[], statMetric: string): number {
    return apps ? apps
      .filter(a => a.entity && a.entity.state !== CfApplicationState.STOPPED)
      .map(a => a.entity[statMetric] * a.entity.instances)
      .reduce((a, t) => a + t, 0) : 0;
  }

  public fetchDomains = () => {
    const action = new FetchAllDomains(this.cfGuid);
    this.paginationSubscription = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.pmf.create(
          action.paginationKey,
          entityFactory(domainSchemaKey)
        )
      },
      true
    ).entities$.subscribe();
  }

  public deleteOrg(orgGuid: string, endpointGuid: string) {
    this.store.dispatch(new DeleteOrganization(orgGuid, endpointGuid));
  }

  fetchApps() {
    this.store.dispatch(this.getAllAppsAction);
  }
}
