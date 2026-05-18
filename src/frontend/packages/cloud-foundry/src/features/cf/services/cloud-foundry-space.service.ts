import { Injectable, Injector, Signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@stratosui/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { SpaceDataRegistry } from '../../../services/endpoint-data/space-data.registry';
import { StSpace } from '../../../services/endpoint-data/stratos-types';
import { createUserRoleInSpace } from '../../../store/types/cf-user.types';

import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IApp, IOrgQuotaDefinition, IRoute, ISpaceQuotaDefinition } from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { getStartedAppInstanceCount } from '../../../cf.helpers';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getSpaceRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService, createOrgQuotaDefinition } from './cloud-foundry-organization.service';

@Injectable({
  providedIn: 'root'
})
export class CloudFoundrySpaceService {
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private store = inject<Store<CFAppState>>(Store);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);
  private cfEndpointService = inject(CloudFoundryEndpointService);
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
  quotaDefinition$!: Observable<ISpaceQuotaDefinition | IOrgQuotaDefinition>;
  /**
   * Actual Space Quota. In almost all cases `quotaDefinition$` should be used instead
   */
  spaceQuotaDefinition$!: Observable<ISpaceQuotaDefinition | null>;
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
    // relationships.quota.data.guid by getNativeSpaceDetail. cfEntityCatalog
    // already serves space-quota entities; just hand it the guid.
    this.spaceQuotaDefinition$ = space$.pipe(
      map(s => s.quotaGuid || null),
      switchMap(quotaGuid => quotaGuid
        ? cfEntityCatalog.spaceQuota.store.getEntityService(quotaGuid, this.cfGuid, {}).waitForEntity$.pipe(
          map(qe => qe.entity.entity as ISpaceQuotaDefinition),
        )
        : of(null as ISpaceQuotaDefinition | null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.quotaDefinition$ = this.spaceQuotaDefinition$.pipe(
      switchMap(def => def ? of(def) : this.cfOrgService.quotaDefinition$),
      map(def => def ?
        {
          ...def,
          organization_guid: this.orgGuid,
        } :
        createOrgQuotaDefinition()
      )
    );
    this.quotaLink$ = combineLatest(this.quotaDefinition$, this.spaceQuotaDefinition$).pipe(
      map(([quota, spaceQuota]) => {
        if (!spaceQuota) {
          return [
            '/cloud-foundry',
            this.cfGuid,
            'organizations',
            this.orgGuid,
            'quota',
          ];
        }

        return quota && [
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
