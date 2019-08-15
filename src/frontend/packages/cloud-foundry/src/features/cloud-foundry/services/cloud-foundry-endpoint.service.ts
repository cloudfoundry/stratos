import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount } from 'rxjs/operators';

import { GetAllApplications } from '../../../../../cloud-foundry/src/actions/application.actions';
import { GetCFInfo } from '../../../../../cloud-foundry/src/actions/cloud-foundry.actions';
import { FetchAllDomains } from '../../../../../cloud-foundry/src/actions/domains.actions';
import { DeleteOrganization, GetAllOrganizations } from '../../../../../cloud-foundry/src/actions/organization.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  cfEntityFactory,
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../../cloud-foundry/src/cf-entity-factory';
import { CfApplicationState } from '../../../../../cloud-foundry/src/store/types/application.types';
import { IApp, ICfV2Info, IOrganization, ISpace } from '../../../../../core/src/core/cf-api.types';
import { EntityService } from '../../../../../core/src/core/entity-service';
import { EntityServiceFactory } from '../../../../../core/src/core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel, EndpointUser } from '../../../../../store/src/types/endpoint.types';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { fetchTotalResults } from '../cf.helpers';
import { QParam, QParamJoiners } from '../../../../../store/src/q-param';

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
        createEntityRelationKey(organizationEntityType, spaceEntityType),
        createEntityRelationKey(organizationEntityType, domainEntityType),
        createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType),
        createEntityRelationKey(organizationEntityType, privateDomainsEntityType),
        createEntityRelationKey(spaceEntityType, routeEntityType), // Not really needed at top level, but if we drop down into an org with
        // lots of spaces it saves spaces x routes requests
      ]);
  }
  static createGetAllOrganizationsLimitedSchema(cfGuid: string) {
    const paginationKey = cfGuid ?
      createEntityRelationPaginationKey(endpointSchemaKey, cfGuid)
      : createEntityRelationPaginationKey(endpointSchemaKey);
    return new GetAllOrganizations(
      paginationKey,
      cfGuid, [
        createEntityRelationKey(organizationEntityType, spaceEntityType),
      ]);
  }

  public static fetchAppCount(store: Store<CFAppState>, pmf: PaginationMonitorFactory, cfGuid: string, orgGuid?: string, spaceGuid?: string)
    : Observable<number> {
    const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
    const uniqueKey = spaceGuid || orgGuid || cfGuid;
    const action = new GetAllApplications(createEntityRelationPaginationKey(parentSchemaKey, uniqueKey), cfGuid);
    action.initialParams = {};
    action.initialParams.q = [];
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, QParamJoiners.in).toString());
    }
    if (spaceGuid) {
      action.initialParams.q.push(new QParam('space_guid', spaceGuid, QParamJoiners.in).toString());
    }
    return fetchTotalResults(action, store, pmf);
  }

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<CFAppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private pmf: PaginationMonitorFactory
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);
    this.getAllAppsAction = new GetAllApplications(createEntityRelationPaginationKey('cf', this.cfGuid), this.cfGuid);

    this.cfEndpointEntityService = this.entityServiceFactory.create(
      this.cfGuid,
      new GetAllEndpoints(),
      false
    );

    this.cfInfoEntityService = this.entityServiceFactory.create<APIResource<ICfV2Info>>(
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
        cfEntityFactory(organizationEntityType)
      )
    }, true).entities$;

    this.info$ = this.cfInfoEntityService.waitForEntity$;

    this.usersCount$ = this.cfUserService.fetchTotalUsers(this.cfGuid);

    this.constructAppObs();

    this.fetchDomains();
  }

  constructAppObs() {
    const appPaginationMonitor = this.pmf.create(this.getAllAppsAction.paginationKey, this.getAllAppsAction);
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
          cfEntityFactory(domainEntityType)
        )
      },
      true
    ).entities$.pipe(first()).subscribe();
  }

  public deleteOrg(orgGuid: string, endpointGuid: string) {
    this.store.dispatch(new DeleteOrganization(orgGuid, endpointGuid));
  }

  fetchApps() {
    this.store.dispatch(this.getAllAppsAction);
  }
}
