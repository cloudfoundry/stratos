import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, Signal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CfInfoDataRegistry } from '../../../services/endpoint-data/cf-info-data.registry';
import { CfInfoDataService } from '../../../services/endpoint-data/cf-info-data.service';
import { CfUsersPagedDataService } from '../../../shared/data-services/cf-users-paged-data.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { stAppToAPIResource } from '../../../services/endpoint-data/st-app-adapter';

import {
  EndpointsDataService,
  getDefaultRequestState,
  APIResource,
  EntityInfo,
  EndpointModel } from '@stratosui/store';
import { IApp, ICfV2Info } from '../../../cf-api.types';
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
  private cnsiUsers = inject(CfUsersPagedDataService);
  private endpointDataRegistry = inject(EndpointDataRegistry);
  private cfInfoDataRegistry = inject(CfInfoDataRegistry);
  private endpointsData = inject(EndpointsDataService);
  private http = inject(HttpClient);
  private injector = inject(Injector);


  apps!: Signal<APIResource<IApp>[]>;
  appsLoading!: Signal<boolean>;
  /**
   * Apps for the recently-updated card: the full list once it has been
   * fetched, before that the newest apps from the counts call, so the
   * card does not say "no applications" while the full list loads.
   */
  recentApps!: Signal<APIResource<IApp>[]>;
  hasApps!: Signal<boolean>;
  appCount!: Signal<number>;
  totalMem!: Signal<number>;
  usersCount!: Signal<number | null>;
  info!: Signal<ICfV2Info | null>;
  hasSSHAccess!: Signal<boolean>;

  // Signal-native apps — backed by EndpointDataService.apps via the
  // EndpointDataRegistry-managed load() / loadDetails() pipeline.
  endpointData!: EndpointDataService;
  // V3-native: CF info flows as ICfV2Info directly (no EntityInfo/APIResource
  // envelope). Field names still match the legacy /v2/info wire shape so
  // consumers reading p.api_version / p.app_ssh_endpoint etc. keep working.
  cfInfoData!: CfInfoDataService;
  /** The endpoint, undefined until the endpoints list has it. */
  endpoint!: Signal<EntityInfo<EndpointModel> | undefined>;
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

    // Guard: when constructed outside a CF route subtree (e.g. CDK overlay
    // injector for the Add User dialog) cfGuid is undefined. Skip ALL data
    // prefetches — no acquire(), no load(), no HTTP — to prevent the 502
    // storm of /pp/v1/cf/<resource>/undefined requests. All members are
    // initialised to inert values so downstream consumers that happen to
    // read them do not throw.
    if (!this.cfGuid) {
      this.cfInfoData = { info: signal(null) } as unknown as CfInfoDataService;
      this.apps = signal([]);
      this.recentApps = signal([]);
      this.appsLoading = signal(false);
      this.hasApps = signal(false);
      this.appCount = signal(0);
      this.totalMem = signal(0);
      this.usersCount = signal(null);
      this.info = signal(null);
      this.hasSSHAccess = signal(false);
      this.endpoint = signal(undefined);
      this.endpointData = {
        apps: signal([]),
        orgs: signal([]),
        appCount: signal(0),
        orgCount: signal(0),
        isLoadingDetails: signal(false),
      } as unknown as EndpointDataService;
      return;
    }

    // V3-native CF info: acquire the registry-cached signal and trigger
    // load() (idempotent — warm-cache short-circuit + in-flight dedup).
    // Replaces cfEntityCatalog.cfInfo.store.getEntityService — the last
    // V2-era info fetcher.
    this.cfInfoData = this.cfInfoDataRegistry.acquire(this.cfGuid);
    this.cfInfoData.load().subscribe({ error: () => {} });
    this.constructCoreObservables();
  }

  private constructCoreObservables() {
    // EndpointsDataService.waitFor() resolves once the endpoints list has
    // the endpoint; wrapped in the EntityInfo envelope readers expect.
    const endpoint$ = from(this.endpointsData.waitFor(this.cfGuid)).pipe(
      map((endpoint: EndpointModel) => ({
        entity: endpoint,
        entityRequestInfo: getDefaultRequestState(),
      } as EntityInfo<EndpointModel>)),
    );
    // toSignal needs an injection context: this runs in the constructor.
    this.endpoint = toSignal(endpoint$, { initialValue: undefined, injector: this.injector });

    this.info = this.cfInfoData.info;
    this.hasSSHAccess = computed(() => {
      const info = this.info();
      return !!(info?.app_ssh_endpoint && info.app_ssh_host_key_fingerprint && info.app_ssh_oauth_client);
    });

    // V3-native: lazy read of the /pp/v1/cf/users/:cnsi cache. Counts every user
    // visible to the connected principal — admin sees the whole CNSI; non-
    // admin sees the role-restricted subset that getNativeUsers returns.
    const users = this.cnsiUsers.users(this.cfGuid);
    this.usersCount = computed(() => users()?.length ?? null);

    this.constructAppObs();
  }

  constructAppObs() {
    // Signal-native apps pipeline — acquire() schedules load() (counts +
    // recent apps fast path) which chains into loadDetails() (full apps
    // list at ?per_page=500).
    this.endpointData = this.endpointDataRegistry.acquire(this.cfGuid);
    this.apps = computed(() => this.endpointData.apps().map(stAppToAPIResource));
    this.appsLoading = this.endpointData.isLoadingDetails;
    this.recentApps = computed(() => this.endpointData.appsLastFetched()
      ? this.apps()
      : this.endpointData.recentApps().map(stAppToAPIResource));
    this.hasApps = computed(() => this.endpointData.apps().length > 0);
    this.appCount = this.endpointData.appCount;
    this.totalMem = computed(() => this.getMetricFromApps(this.apps(), 'memory'));
  }

  public getMetricFromApps(apps: APIResource<IApp>[], statMetric: string): number {
    return apps ? apps
      .filter(a => a.entity && a.entity.state !== CfApplicationState.STOPPED)
      .map(a => (a.entity as Record<string, any>)[statMetric] * (a.entity.instances ?? 0))
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
