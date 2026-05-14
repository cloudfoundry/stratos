import { Injectable, Injector, Signal, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';
import { take, filter, map, publishReplay, refCount } from 'rxjs/operators';

import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { stAppToAPIResource } from '../../../services/endpoint-data/st-app-adapter';

import {
  EntityService,
  endpointEntityType,
  PaginationMonitorFactory,
  getPaginationObservables,
  stratosEntityCatalog,
  APIResource,
  EntityInfo,
  EndpointModel,
  EndpointUser,
  PaginatedAction,
  Store } from '@stratosui/store';
import { GetAllApplications } from '../../../actions/application.actions';
import { GetAllRoutes } from '../../../actions/route.actions';
import { GetSpaceRoutes } from '../../../actions/space.actions';
import { IApp, ICfV2Info, IOrganization, ISpace } from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../cf-entity-factory';
import {
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  spaceEntityType } from '../../../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey } from '../../../entity-relations/entity-relations.types';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { QParam, QParamJoiners } from '../../../shared/q-param';
import { CfApplicationState } from '../../../store/types/application.types';
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


@Injectable({
  providedIn: 'root'
})
export class CloudFoundryEndpointService {
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private store = inject<Store<CFAppState>>(Store);
  private cfUserService = inject(CfUserService);
  private pmf = inject(PaginationMonitorFactory);
  private cnsiUsers = inject(CnsiUsersSnapshotService);
  private endpointDataRegistry = inject(EndpointDataRegistry);
  private injector = inject(Injector);


  hasSSHAccess$!: Observable<boolean>;
  totalMem$!: Observable<number>;
  paginationSubscription!: Subscription;
  // Signal-native apps stream — backed by EndpointDataService.apps via the
  // EndpointDataRegistry-managed load() / loadDetails() pipeline. Replaces
  // the legacy `appsPagObs` PaginationObservables that hit
  // /pp/v1/cf/apps?...&results-per-page=100 in parallel with the
  // signal-native ?per_page=500 fetch and double-fired every downstream
  // consumer (recent-apps stats fetch, totals, list filters).
  endpointData!: EndpointDataService;
  apps$!: Observable<APIResource<IApp>[]>;
  appsLoading$!: Observable<boolean>;
  hasApps$!: Observable<boolean>;
  appCount$!: Observable<number>;
  usersCount$!: Observable<number | null>;
  orgs$!: Observable<APIResource<IOrganization>[]>;
  info$!: Observable<EntityInfo<APIResource<ICfV2Info>>>;
  cfInfoEntityService!: EntityService<APIResource<ICfV2Info>>;
  endpoint$!: Observable<EntityInfo<EndpointModel>>;
  /**
   * Sync signal mirror of `endpoint$`. Hot read from anywhere — no race,
   * no observable subscription. Use this for one-shot reads at action
   * time (e.g. building a confirm dialog) where awaiting an observable
   * loses to the 1s fallback when the underlying observable hasn't yet
   * emitted a value through fresh subscribers (post route-recreate).
   * `endpoint$` stays for stream consumers (combineLatest, derived
   * observables, async-pipe templates).
   */
  endpoint!: Signal<EntityInfo<EndpointModel> | undefined>;
  cfEndpointEntityService!: EntityService<EndpointModel>;
  connected$!: Observable<boolean>;
  currentUser$!: Observable<EndpointUser>;
  cfGuid: string;

  static createGetAllOrganizations(cfGuid: string) {
    const paginationKey = createEntityRelationPaginationKey(endpointEntityType, cfGuid);
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
    const paginationKey = createEntityRelationPaginationKey(endpointEntityType, cfGuid);
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

  // Fetch the cound of organisations in a Cloud Foundry
  public static fetchOrgCount(store: Store<CFAppState>, pmf: PaginationMonitorFactory, cfGuid: string): Observable<number> {
    const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(cfGuid);
    return fetchTotalResults(getAllOrgsAction, store, pmf);
  }

  public static fetchOrgs(store: Store<CFAppState>, pmf: PaginationMonitorFactory, cfGuid: string):
    Observable<APIResource<IOrganization>[]> {
    const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(cfGuid);
    return getPaginationObservables<APIResource<IOrganization>>({
      store,
      action: getAllOrgsAction,
      paginationMonitor: pmf.create(
        getAllOrgsAction.paginationKey,
        cfEntityFactory(organizationEntityType),
        getAllOrgsAction.flattenPagination
      )
    }, getAllOrgsAction.flattenPagination).entities$;
  }

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;

    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.cfEndpointEntityService = stratosEntityCatalog.endpoint.store.getEntityService(this.cfGuid);

    this.cfInfoEntityService = cfEntityCatalog.cfInfo.store.getEntityService(this.cfGuid);
    this.constructCoreObservables();
    this.constructSecondaryObservable();
  }

  private constructCoreObservables() {
    this.endpoint$ = this.cfEndpointEntityService.waitForEntity$;
    // Sync mirror — backs the new `endpoint` signal. toSignal needs an
    // injection context; we have one because constructCoreObservables runs
    // during constructor execution.
    this.endpoint = toSignal(this.endpoint$, { initialValue: undefined, injector: this.injector });

    this.orgs$ = CloudFoundryEndpointService.fetchOrgs(this.store, this.pmf, this.cfGuid);

    this.info$ = this.cfInfoEntityService.waitForEntity$;

    // V3-native: lazy snapshot of /pp/v1/cf/users/:cnsi. Counts every user
    // visible to the connected principal — admin sees the whole CNSI; non-
    // admin sees the role-restricted subset that getNativeUsers returns.
    this.usersCount$ = toObservable(this.cnsiUsers.users(this.cfGuid), { injector: this.injector }).pipe(
      map(users => users === null ? null : users.length),
    );

    this.constructAppObs();
  }

  constructAppObs() {
    // Signal-native apps pipeline — acquire() schedules load() (counts +
    // recent apps fast path) which chains into loadDetails() (full apps
    // list at ?per_page=500). The legacy ngrx pagination fetcher
    // (cfEntityCatalog.application.store.getPaginationService) is gone;
    // every CF page-tree consumer now reads through these observables
    // bridged off the EndpointDataService signals.
    this.endpointData = this.endpointDataRegistry.acquire(this.cfGuid);
    const appsResources = computed(() => this.endpointData.apps().map(stAppToAPIResource));
    this.apps$ = toObservable(appsResources, { injector: this.injector });
    this.appsLoading$ = toObservable(this.endpointData.isLoadingDetails, { injector: this.injector });
    this.hasApps$ = toObservable(
      computed(() => this.endpointData.apps().length > 0),
      { injector: this.injector },
    );
    this.appCount$ = toObservable(this.endpointData.appCount, { injector: this.injector });
  }

  private constructSecondaryObservable() {
    this.hasSSHAccess$ = this.info$.pipe(
      map(p => !!(p.entity.entity &&
        p.entity.entity.app_ssh_endpoint &&
        p.entity.entity.app_ssh_host_key_fingerprint &&
        p.entity.entity.app_ssh_oauth_client))
    );
    this.totalMem$ = this.apps$.pipe(map(apps => this.getMetricFromApps(apps, 'memory')));

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), take(1), publishReplay(1), refCount());
  }

  public getAppsInOrgViaAllApps(org: APIResource<IOrganization>): Observable<APIResource<IApp>[]> {
    return this.apps$.pipe(
      filter(allApps => !!allApps),
      map(allApps => {
        const spaces = org.entity.spaces || [];
        const orgSpaces = spaces.map(s => s.metadata.guid);
        return allApps.filter(a => orgSpaces.indexOf(a.entity.space_guid) !== -1);
      })
    );
  }

  public getAppsInSpaceViaAllApps(space: APIResource<ISpace>): Observable<APIResource<IApp>[]> {
    return this.apps$.pipe(
      filter(allApps => !!allApps),
      map(apps => {
        return apps.filter(a => a.entity.space_guid === space.metadata.guid);
      })
    );
  }

  public getMetricFromApps(apps: APIResource<IApp>[], statMetric: string): number {
    return apps ? apps
      .filter(a => a.entity && a.entity.state !== CfApplicationState.STOPPED)
      .map(a => (a.entity as Record<string, any>)[statMetric] * a.entity.instances)
      .reduce((a, t) => a + t, 0) : 0;
  }

  public fetchDomains() {
    cfEntityCatalog.domain.api.getMultiple(this.cfGuid, null, {});
  }

  public deleteOrg(orgGuid: string, endpointGuid: string) {
    cfEntityCatalog.org.api.remove(orgGuid, endpointGuid);
  }

  fetchApps() {
    // Signal-native refresh: re-runs loadDetails() which re-populates the
    // apps signal. Internal call sites (org / space services) called this
    // for "make sure the apps cache is warm before reading appsPagObs" —
    // the new pipeline already enqueues loadDetails on acquire(), so this
    // is now an explicit re-fetch (e.g. user-initiated refresh button).
    this.endpointData.loadDetails().subscribe();
  }

}
