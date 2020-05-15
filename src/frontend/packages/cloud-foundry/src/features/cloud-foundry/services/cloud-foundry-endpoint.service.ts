import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount } from 'rxjs/operators';

import { GetAllApplications } from '../../../../../cloud-foundry/src/actions/application.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  spaceEntityType,
} from '../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { CfApplicationState } from '../../../../../cloud-foundry/src/store/types/application.types';
import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import { EntityService } from '../../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel, EndpointUser } from '../../../../../store/src/types/endpoint.types';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { GetAllRoutes } from '../../../actions/route.actions';
import { GetSpaceRoutes } from '../../../actions/space.actions';
import { IApp, ICfV2Info, IOrganization, ISpace } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../cf-entity-factory';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { QParam, QParamJoiners } from '../../../shared/q-param';
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

  static createGetAllOrganizations(cfGuid: string) {
    const paginationKey = cfGuid ?
      createEntityRelationPaginationKey(endpointSchemaKey, cfGuid)
      : createEntityRelationPaginationKey(endpointSchemaKey);
    const getAllOrganizationsAction = cfEntityCatalog.org.actions.getMultiple(cfGuid, paginationKey,
      {
        includeRelations: [
          createEntityRelationKey(organizationEntityType, spaceEntityType),
          createEntityRelationKey(organizationEntityType, domainEntityType),
          createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType),
          createEntityRelationKey(organizationEntityType, privateDomainsEntityType),
        ], populateMissing: false
      });
    return getAllOrganizationsAction;
  }
  static createGetAllOrganizationsLimitedSchema(cfGuid: string) {
    const paginationKey = cfGuid ?
      createEntityRelationPaginationKey(endpointSchemaKey, cfGuid)
      : createEntityRelationPaginationKey(endpointSchemaKey);
    const getAllOrganizationsAction = cfEntityCatalog.org.actions.getMultiple(cfGuid, paginationKey,
      {
        includeRelations: [
          createEntityRelationKey(organizationEntityType, spaceEntityType),
        ]
      }) as PaginatedAction;
    return getAllOrganizationsAction;
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

  public static fetchRouteCount(
    store: Store<CFAppState>,
    pmf: PaginationMonitorFactory,
    cfGuid: string,
    orgGuid?: string,
    spaceGuid?: string)
    : Observable<number> {
    if (spaceGuid) {
      const spaceAction =
        new GetSpaceRoutes(spaceGuid, cfGuid, createEntityRelationPaginationKey(spaceEntityType, spaceGuid), [], false, false);
      return fetchTotalResults(spaceAction, store, pmf);
    }

    const parentSchemaKey = orgGuid ? organizationEntityType : 'cf';
    const uniqueKey = orgGuid || cfGuid;
    const action = new GetAllRoutes(cfGuid, createEntityRelationPaginationKey(parentSchemaKey, uniqueKey), [], false);
    action.initialParams = {};
    action.initialParams.q = [];
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, QParamJoiners.in).toString());
    }
    return fetchTotalResults(action, store, pmf);
  }

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<CFAppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private pmf: PaginationMonitorFactory,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;

    this.cfEndpointEntityService = this.entityServiceFactory.create(
      this.cfGuid,
      new GetAllEndpoints()
    );

    this.cfInfoEntityService = cfEntityCatalog.cfInfo.store.getEntityService(this.cfGuid)
    this.constructCoreObservables();
    this.constructSecondaryObservable();
  }

  private constructCoreObservables() {
    this.endpoint$ = this.cfEndpointEntityService.waitForEntity$;

    const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);
    this.orgs$ = getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: getAllOrgsAction,
      paginationMonitor: this.pmf.create(
        getAllOrgsAction.paginationKey,
        cfEntityFactory(organizationEntityType),
        getAllOrgsAction.flattenPagination
      )
    }, getAllOrgsAction.flattenPagination).entities$;

    this.info$ = this.cfInfoEntityService.waitForEntity$;

    this.usersCount$ = this.cfUserService.fetchTotalUsers(this.cfGuid);

    this.constructAppObs();
  }

  constructAppObs() {
    this.appsPagObs = cfEntityCatalog.application.store.getPaginationService(this.cfGuid);
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

  public fetchDomains() {
    cfEntityCatalog.domain.api.getMultiple(this.cfGuid, null, {});
  }

  public deleteOrg(orgGuid: string, endpointGuid: string) {
    cfEntityCatalog.org.api.remove(orgGuid, endpointGuid);
  }

  fetchApps() {
    cfEntityCatalog.application.api.getMultiple(this.cfGuid);
  }

}
