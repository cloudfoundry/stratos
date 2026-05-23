import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, Signal, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subscription, from } from 'rxjs';
import { catchError, take, filter, map, publishReplay, refCount } from 'rxjs/operators';
import { of } from 'rxjs';

import { CfInfoDataRegistry } from '../../../services/endpoint-data/cf-info-data.registry';
import { CfInfoDataService } from '../../../services/endpoint-data/cf-info-data.service';
import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { stAppToAPIResource } from '../../../services/endpoint-data/st-app-adapter';
import { stOrgToAPIResource } from '../../../services/endpoint-data/st-org-adapter';

import {
  EntityService,
  EndpointsDataService,
  getDefaultRequestState,
  APIResource,
  EntityInfo,
  EndpointModel,
  EndpointUser } from '@stratosui/store';
import { IApp, ICfV2Info, IOrganization, ISpace } from '../../../cf-api.types';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { CfApplicationState } from '../../../store/types/application.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

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
  private cfUserService = inject(CfUserService);
  private cnsiUsers = inject(CnsiUsersSnapshotService);
  private endpointDataRegistry = inject(EndpointDataRegistry);
  private cfInfoDataRegistry = inject(CfInfoDataRegistry);
  private endpointsData = inject(EndpointsDataService);
  private http = inject(HttpClient);
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
  // V3-native: CF info flows as ICfV2Info directly (no EntityInfo/APIResource
  // envelope). Field names still match the legacy /v2/info wire shape so
  // consumers reading p.api_version / p.app_ssh_endpoint etc. keep working.
  info$!: Observable<ICfV2Info>;
  cfInfoData!: CfInfoDataService;
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

  // Instance helpers replacing the static V2 ngrx-pagination count fetchers.
  // Each hits the Jetstream native ?return=counts branch with an optional
  // organization_guids / space_guids filter — the backend now honors both
  // filter names on the counts tier (A.#1). Errors fall through to 0 so a
  // transient CAPI hiccup never throws a count-cell into red.
  public fetchAppCount(orgGuid?: string, spaceGuid?: string): Observable<number> {
    return this.fetchCountFor('apps', orgGuid, spaceGuid);
  }

  public fetchRouteCount(orgGuid?: string, spaceGuid?: string): Observable<number> {
    return this.fetchCountFor('routes', orgGuid, spaceGuid);
  }

  private fetchCountFor(resource: 'apps' | 'routes', orgGuid?: string, spaceGuid?: string): Observable<number> {
    const params: string[] = ['return=counts'];
    if (orgGuid) {
      params.push(`organization_guids=${encodeURIComponent(orgGuid)}`);
    }
    if (spaceGuid) {
      params.push(`space_guids=${encodeURIComponent(spaceGuid)}`);
    }
    const url = `/pp/v1/cf/${resource}/${this.cfGuid}?${params.join('&')}`;
    return this.http.get<{ totalResults: number }>(url).pipe(
      map(resp => resp?.totalResults ?? 0),
      catchError(() => of(0)),
    );
  }


  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;

    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    // W36-B Wave 3: keep cfEndpointEntityService unset — the legacy
    // EntityService is no longer the source for endpoint reads. The
    // field is retained as `any` for backward-compat (some downstream
    // tests still reference its type) but no consumer reads from it
    // directly within this service.
    this.cfEndpointEntityService = null as unknown as EntityService<EndpointModel>;

    // V3-native CF info: acquire the registry-cached signal and trigger
    // load() (idempotent — warm-cache short-circuit + in-flight dedup).
    // Replaces cfEntityCatalog.cfInfo.store.getEntityService — the last
    // V2-era info fetcher.
    this.cfInfoData = this.cfInfoDataRegistry.acquire(this.cfGuid);
    this.cfInfoData.load().subscribe({ error: () => {} });
    this.constructCoreObservables();
    this.constructSecondaryObservable();
  }

  private constructCoreObservables() {
    // W36-B Wave 3: replace cfEndpointEntityService.waitForEntity$ with
    // the signal-native EndpointsDataService.waitFor() promise lifted
    // to an Observable. Wrap in EntityInfo envelope so existing
    // downstream consumers (`endpoint$.entity.foo`) keep working —
    // those consumers are out of Wave 3 scope.
    this.endpoint$ = from(this.endpointsData.waitFor(this.cfGuid)).pipe(
      map((endpoint: EndpointModel) => ({
        entity: endpoint,
        entityRequestInfo: getDefaultRequestState(),
      } as EntityInfo<EndpointModel>)),
    );
    // Sync mirror — backs the new `endpoint` signal. toSignal needs an
    // injection context; we have one because constructCoreObservables runs
    // during constructor execution.
    this.endpoint = toSignal(this.endpoint$, { initialValue: undefined, injector: this.injector });

    this.info$ = toObservable(this.cfInfoData.info, { injector: this.injector }).pipe(
      filter((info): info is ICfV2Info => !!info),
    );

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

    // V3-native orgs pipeline — replaces the legacy
    // cfEntityCatalog.org.actions.getMultiple(... includeRelations: [...])
    // path that fired ?include-relations=spaces,domains,quotas,private_domains
    // on every CF endpoint nav. EndpointDataService.loadDetails() drains all
    // pages from /pp/v1/cf/orgs/{cnsi} (page 1 inline, pages 2..N parallel)
    // so the full org list is exposed — bridge StOrg[] back into the legacy
    // APIResource<IOrganization>[] envelope so add-/edit-organization name-
    // uniqueness checks (the only remaining consumers) keep compiling.
    const orgsResources = computed(() => this.endpointData.orgs().map(stOrgToAPIResource));
    this.orgs$ = toObservable(orgsResources, { injector: this.injector });
  }

  private constructSecondaryObservable() {
    this.hasSSHAccess$ = this.info$.pipe(
      map(info => !!(info.app_ssh_endpoint
        && info.app_ssh_host_key_fingerprint
        && info.app_ssh_oauth_client))
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

  fetchApps() {
    // Signal-native refresh: refreshDetails() forces a re-fetch of
    // orgs+apps+spaces, bypassing the cache guard that loadDetails()
    // honours. This is the user-initiated refresh entry point — the
    // initial-hydration path is loadDetails() on registry acquire.
    this.endpointData.refreshDetails().subscribe();
  }

}
