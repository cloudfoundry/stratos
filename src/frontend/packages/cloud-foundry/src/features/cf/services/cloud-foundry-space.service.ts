import { DestroyRef, Injectable, Injector, Signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { observeSignal } from '@stratosui/store';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { CfUsersPagedDataService } from '../../../shared/data-services/cf-users-paged-data.service';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { SpaceDataRegistry } from '../../../services/endpoint-data/space-data.registry';
import { StOrgQuota, StSpace, StSpaceQuota } from '../../../services/endpoint-data/stratos-types';
import { createUserRoleInSpace } from '../../../store/types/cf-user.types';

import { APIResource } from '../../../../../store/src/types/api.types';
import { IApp } from '../../../cf-api.types';
import { getStartedAppInstanceCount } from '../../../cf.helpers';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getSpaceRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from './cloud-foundry-organization.service';

@Injectable({
  providedIn: 'root'
})
export class CloudFoundrySpaceService {
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private quotaData = inject(QuotaDataService);
  private cfUserProvidedServicesService = inject(CloudFoundryUserProvidedServicesService);
  private serviceCatalog = inject(ServiceCatalogDataService);
  private cfOrgService = inject(CloudFoundryOrganizationService);
  private cnsiUsers = inject(CfUsersPagedDataService);
  private spaceDataRegistry = inject(SpaceDataRegistry);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  // Registry returns the same instance as the space-base component's provider,
  // so reads here hit the shared, in-flight-deduped signal — no extra HTTP.
  readonly spaceDataService = this.spaceDataRegistry.acquire(
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.spaceGuid,
  );

  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;

  // The HTTP-backed members (quota, app count fallback and
  // user-provided service count) stay Observables: this service lives on
  // every space page, so a reader turns them into signals where it needs them
  // and the requests go out only from the pages that show them.
  apps!: Signal<APIResource<IApp>[]>;
  appInstances!: Signal<number>;
  totalMem!: Signal<number>;
  loadingApps!: Signal<boolean>;
  usersCount!: Signal<number | null>;
  userRole!: Signal<string | null>;
  routesCount!: Signal<number | null>;

  /**
   * Sensible quota to use for space. If there's no specific space quota set this will be the org quota. If there's no org quota
   * a mock quota with everything allowed will be used
   */
  // V3-shape: emits the effective quota (StSpaceQuota when the space has
  // its own quota, else falls back to org's StOrgQuota). Consumers must
  // read V3 camelCase fields (totalMemoryInMB etc.). Returns null if
  // neither quota is set — template branches replace the legacy
  // `createOrgQuotaDefinition()` mock with explicit "None" rendering.
  quotaDefinition$!: Observable<StSpaceQuota | StOrgQuota | null>;
  /** Actual Space Quota (null when the space inherits the org quota). */
  spaceQuotaDefinition$!: Observable<StSpaceQuota | null>;
  serviceInstancesCount!: Signal<number>;
  userProvidedServiceInstancesCount$!: Observable<number>;

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;

    this.spaceGuid = activeRouteCfOrgSpace.spaceGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;

    // Kick off the space load so consumers reading spaceDataService.space
    // signal get a populated value. Mirrors CloudFoundryOrganizationService
    // which loads the org on construction — direct-URL routes that don't
    // pass through cloud-foundry-space-base (notably /edit-space) would
    // otherwise see space()===null and prefill with empty form values.
    // Warm-cache short-circuit makes it a no-op when the signal is hot.
    this.spaceDataService.load().subscribe({ error: () => {} });

    this.initialiseObservables();
  }

  public fetchApps() {
    this.cfEndpointService.fetchApps();
  }

  private initialiseObservables() {
    this.initialiseSpaceObservables();
    this.initialiseAppObservables();

    // V3-native: read role buckets from the StUser cache (lazy fetch of
    // /pp/v1/cf/users/:cnsi). V2 helpers inspect user.managed_spaces etc. —
    // fields the V3 wire no longer carries.
    const users = this.cnsiUsers.users(this.cfGuid);
    this.userRole = computed(() => {
      const all = users();
      const currentUser = this.cfEndpointService.endpoint()?.entity.user;
      // Still loading: the tile shows its placeholder, not 'None'.
      if (!all || !currentUser) return null;
      const me = all.find(u => u.guid === currentUser.guid);
      const roles = me?.spaceRoles.find(r => r.spaceGuid === this.spaceGuid)?.roles ?? [];
      return getSpaceRolesString(createUserRoleInSpace(
        roles.includes('manager'),
        roles.includes('auditor'),
        roles.includes('developer'),
      ));
    });
    this.usersCount = computed(() => {
      const all = users();
      if (!all) return null;
      return all.filter(u => u.spaceRoles.some(r => r.spaceGuid === this.spaceGuid)).length;
    });
  }

  private initialiseSpaceObservables() {
    const space$ = toObservable(this.spaceDataService.space, { injector: this.injector }).pipe(
      filter((s): s is StSpace => !!s),
    );

    // Quota tile: managed only — user-provided instances don't count
    // against the service-instance quota (#5769); they get their own tile.
    this.serviceInstancesCount = this.serviceCatalog.serviceInstanceCount(this.cfGuid, this.orgGuid, this.spaceGuid, 'managed').value;
    this.userProvidedServiceInstancesCount$ =
      this.cfUserProvidedServicesService.fetchUserProvidedServiceInstancesCount(this.cfGuid, this.orgGuid, this.spaceGuid);
    // Route count from the V3-native StSpace.routeCount aggregate
    // (server-side fill); null until the space has arrived.
    this.routesCount = computed(() => {
      const space = this.spaceDataService.space();
      return space ? space.routeCount ?? 0 : null;
    });
    // V3-native space-quota lookup. quotaGuid mapped from V3
    // relationships.quota.data.guid by getNativeSpaceDetail. The
    // QuotaDataService returns a SignalSource; we bridge to Observable
    // for backwards-compat templates and chain into the org-quota
    // fallback below.
    //
    // observeSignal, not toObservable: toObservable's effect would outlive
    // switchMap's unsubscribe, so each space re-emission (load, patch after
    // an edit) would add one more effect for the life of the page.
    this.spaceQuotaDefinition$ = space$.pipe(
      map(s => s.quotaGuid || null),
      // A rename patches the space but keeps its quota
      distinctUntilChanged(),
      switchMap(quotaGuid => quotaGuid
        ? observeSignal(this.quotaData.spaceQuota(this.cfGuid, quotaGuid).value, this.injector)
        : of(null as StSpaceQuota | null)),
      // observeSignal ends only on unsubscribe and shareReplay keeps its one
      // subscription, so end it with the page that owns this service.
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    // Effective quota: prefer space-specific, fall back to org. Org-quota
    // emission can itself be null (org has no quota set) — caller renders
    // that as "None" rather than substituting a fake "everything allowed"
    // shim (the V3 -1 = Unlimited semantics make the shim redundant).
    this.quotaDefinition$ = this.spaceQuotaDefinition$.pipe(
      switchMap(def => def ? of(def) : this.cfOrgService.quotaDefinition$.pipe(map(q => q ?? null))),
    );
  }

  private initialiseAppObservables() {
    // The foundation-wide apps filtered to this space.
    this.apps = computed(() => this.cfEndpointService.apps().filter(a => a.entity.space_guid === this.spaceGuid));
    this.appInstances = computed(() => getStartedAppInstanceCount(this.apps()));
    this.totalMem = computed(() => this.cfEndpointService.getMetricFromApps(this.apps(), 'memory'));
    this.loadingApps = this.cfEndpointService.appsLoading;
  }
}
