import { Injectable, Injector, Signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
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
  private cnsiUsers = inject(CnsiUsersSnapshotService);
  private spaceDataRegistry = inject(SpaceDataRegistry);
  private injector = inject(Injector);

  // Registry returns the same instance as the space-base component's provider,
  // so reads here hit the shared, in-flight-deduped signal — no extra HTTP.
  readonly spaceDataService = this.spaceDataRegistry.acquire(
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.spaceGuid,
  );

  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  userRole$!: Observable<string>;
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
  allowSsh$!: Observable<string>;
  totalMem$!: Observable<number>;
  // Route count derived from the V3-native StSpace.routeCount aggregate
  // (server-side fill). The full route list is loaded by the routes-tab
  // data source separately — this stream exists for the summary tile's
  // "Routes" card only.
  routesCount$!: Observable<number>;
  serviceInstancesCount!: Signal<number>;
  userProvidedServiceInstancesCount$!: Observable<number>;
  appInstances$!: Observable<number>;
  apps$!: Observable<APIResource<IApp>[]>;
  appCount$!: Observable<number>;
  loadingApps$!: Observable<boolean>;
  usersCount$!: Observable<number | null>;
  quotaLink$!: Observable<string[]>;

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

    // V3-native: read role buckets from the StUser snapshot (lazy fetch of
    // /pp/v1/cf/users/:cnsi). V2 helpers inspect user.managed_spaces etc. —
    // fields the V3 wire no longer carries.
    const users$ = toObservable(this.cnsiUsers.users(this.cfGuid), { injector: this.injector });
    this.userRole$ = combineLatest([this.cfEndpointService.currentUser$, users$]).pipe(
      map(([currentUser, users]) => {
        if (!users) return 'None';
        const me = users.find(u => u.guid === currentUser.guid);
        const roles = me?.spaceRoles.find(r => r.spaceGuid === this.spaceGuid)?.roles ?? [];
        return getSpaceRolesString(createUserRoleInSpace(
          roles.includes('manager'),
          roles.includes('auditor'),
          roles.includes('developer'),
        ));
      }),
    );

    this.usersCount$ = users$.pipe(
      map(users => {
        if (!users) return null;
        return users.filter(u => u.spaceRoles.some(r => r.spaceGuid === this.spaceGuid)).length;
      }),
    );
  }

  private initialiseSpaceObservables() {
    const space$ = toObservable(this.spaceDataService.space, { injector: this.injector }).pipe(
      filter((s): s is StSpace => !!s),
    );

    this.serviceInstancesCount = this.serviceCatalog.serviceInstanceCount(this.cfGuid, this.orgGuid, this.spaceGuid).value;
    this.userProvidedServiceInstancesCount$ =
      this.cfUserProvidedServicesService.fetchUserProvidedServiceInstancesCount(this.cfGuid, this.orgGuid, this.spaceGuid);
    this.routesCount$ = space$.pipe(map(s => s.routeCount ?? 0));
    this.allowSsh$ = space$.pipe(map(s => s.allowSsh ? 'true' : 'false'));
    // V3-native space-quota lookup. quotaGuid mapped from V3
    // relationships.quota.data.guid by getNativeSpaceDetail. The
    // QuotaDataService returns a SignalSource; we bridge to Observable
    // for backwards-compat templates and chain into the org-quota
    // fallback below.
    this.spaceQuotaDefinition$ = space$.pipe(
      map(s => s.quotaGuid || null),
      switchMap(quotaGuid => quotaGuid
        ? toObservable(this.quotaData.spaceQuota(this.cfGuid, quotaGuid).value, { injector: this.injector })
        : of(null as StSpaceQuota | null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    // Effective quota: prefer space-specific, fall back to org. Org-quota
    // emission can itself be null (org has no quota set) — caller renders
    // that as "None" rather than substituting a fake "everything allowed"
    // shim (the V3 -1 = Unlimited semantics make the shim redundant).
    this.quotaDefinition$ = this.spaceQuotaDefinition$.pipe(
      switchMap(def => def ? of(def) : this.cfOrgService.quotaDefinition$.pipe(map(q => q ?? null))),
    );
    this.quotaLink$ = combineLatest(this.quotaDefinition$, this.spaceQuotaDefinition$).pipe(
      map(([_quota, spaceQuota]) => {
        if (!spaceQuota) {
          return [
            '/cloud-foundry',
            this.cfGuid,
            'organizations',
            this.orgGuid,
            'quota',
          ];
        }

        // quotaDefinition$ resolves to the space-specific quota whenever
        // spaceQuota is present (see quotaDefinition$ above), so reaching
        // here always means a space quota exists — link to it directly.
        // strict: the prior `quota && [...]` guard's null branch was
        // unreachable; dropping it keeps the emitted shape as string[].
        return [
          '/cloud-foundry',
          this.cfGuid,
          'organizations',
          this.orgGuid,
          'spaces',
          this.spaceGuid,
          'space-quota'
        ];
      }
      )
    );
  }

  private initialiseAppObservables() {
    // V3-native: derive apps for this space from the foundation-wide apps
    // stream filtered by space_guid (mirrors the cf-org-service pattern).
    // Old getAppsInSpaceViaAllApps required an APIResource<ISpace> envelope
    // which we no longer carry.
    this.apps$ = this.cfEndpointService.apps$.pipe(
      filter(apps => !!apps),
      map(allApps => allApps.filter(a => a.entity.space_guid === this.spaceGuid)),
    );

    this.appInstances$ = this.apps$.pipe(
      map(getStartedAppInstanceCount)
    );

    this.totalMem$ = this.apps$.pipe(
      map(a => this.cfEndpointService.getMetricFromApps(a, 'memory'))
    );

    this.appCount$ = this.cfEndpointService.hasApps$.pipe(
      switchMap(hasAllApps => hasAllApps ? this.countExistingApps() : this.fetchAppCount()),
    );

    this.loadingApps$ = this.cfEndpointService.appsLoading$;
  }

  private countExistingApps(): Observable<number> {
    return this.apps$.pipe(
      map(apps => apps.length)
    );
  }

  private fetchAppCount(): Observable<number> {
    return this.cfEndpointService.fetchAppCount(
      this.activeRouteCfOrgSpace.orgGuid,
      this.activeRouteCfOrgSpace.spaceGuid
    );
  }
}
