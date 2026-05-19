import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, Signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Route } from '@angular/router';
import { combineLatest, EMPTY, Observable } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { OrgDataRegistry } from '../../../services/endpoint-data/org-data.registry';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { StOrgDetail, StOrgQuota, StSpace } from '../../../services/endpoint-data/stratos-types';
import { createUserRoleInOrg } from '../../../store/types/cf-user.types';

import { APIResource } from '../../../../../store/src/types/api.types';
import {
  IApp,
  IOrgQuotaDefinition,
  ISpaceQuotaDefinition,
} from '../../../cf-api.types';
import { getStartedAppInstanceCount } from '../../../cf.helpers';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getOrgRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

// V3-shape private domain envelope; we only read .length downstream so a
// minimal shape suffices.
interface StPrivateDomain {
  guid: string;
  name: string;
}
interface StPrivateDomainsResponse {
  resources: StPrivateDomain[];
}

export const createOrgQuotaDefinition = (): IOrgQuotaDefinition => ({
  memory_limit: -1,
  app_instance_limit: -1,
  instance_memory_limit: -1,
  name: 'None assigned',
  total_services: -1,
  total_routes: -1,
  app_task_limit: -1,
  total_reserved_route_ports: -1,
  total_service_keys: -1,
  trial_db_allowed: false
});

export const createSpaceQuotaDefinition = (orgGuid: string): ISpaceQuotaDefinition => ({
  memory_limit: -1,
  app_instance_limit: -1,
  instance_memory_limit: -1,
  name: 'None assigned',
  total_services: -1,
  total_routes: -1,
  app_task_limit: -1,
  total_reserved_route_ports: -1,
  total_service_keys: -1,
  organization_guid: orgGuid
});

@Injectable({
  providedIn: 'root'
})
export class CloudFoundryOrganizationService {
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private http = inject(HttpClient);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private cfUserProvidedServicesService = inject(CloudFoundryUserProvidedServicesService);
  private serviceCatalog = inject(ServiceCatalogDataService);
  private quotaData = inject(QuotaDataService);
  private cnsiUsers = inject(CnsiUsersSnapshotService);
  private orgDataRegistry = inject(OrgDataRegistry);
  private injector = inject(Injector);

  readonly orgDataService = this.orgDataRegistry.acquire(
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.orgGuid,
  );

  orgGuid: string;
  cfGuid: string;
  quotaLink$!: Observable<string[] | undefined>;
  userOrgRole$!: Observable<string>;
  // V3-shape — quotaDefinition$ now emits StOrgQuota directly. Consumers
  // that previously read V2 fields (memory_limit, etc.) must read the V3
  // camelCase equivalents (totalMemoryInMB, etc.). Backwards-compat shim
  // lives in space-detail template which still mixes IOrgQuotaDefinition
  // for the union with space-quota fallback.
  quotaDefinition$!: Observable<StOrgQuota>;
  totalMem$!: Observable<number>;
  // V3-native: signal of StPrivateDomain[] surfaced as Observable for
  // template binding compatibility. Downstream only reads .length.
  privateDomains$!: Observable<StPrivateDomain[]>;
  routes$!: Observable<APIResource<Route>[]>;
  serviceInstancesCount!: Signal<number>;
  userProvidedServiceInstancesCount$!: Observable<number>;
  routesCount$!: Observable<number>;
  // V3-shape — spaces$ now emits StSpace[] direct from OrgDataService.
  spaces$!: Observable<StSpace[]>;
  appInstances$!: Observable<number>;
  apps$!: Observable<APIResource<IApp>[]>;
  appCount$!: Observable<number>;
  loadingApps$!: Observable<boolean>;
  usersCount$!: Observable<number | null>;

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.initialiseObservables();
  }

  public deleteSpace(spaceGuid: string, _orgGuid: string, endpointGuid: string): void {
    // V3-native DELETE /pp/v1/cf/spaces/:cnsi/:guid — fire-and-forget.
    // Callers that need outcome tracking should consume the http response
    // directly (none today; the only caller dispatches and walks away).
    this.http.delete(`/pp/v1/cf/spaces/${endpointGuid}/${spaceGuid}`).subscribe({
      error: () => {/* swallow — UI consumer reads via row refresh */},
    });
  }

  public fetchApps() {
    this.cfEndpointService.fetchApps();
  }

  private initialiseObservables() {
    this.initialiseOrgObservables();
    this.initialiseAppObservables();
    this.initialiseSpaceObservables();

    const users$ = toObservable(this.cnsiUsers.users(this.cfGuid), { injector: this.injector });
    this.userOrgRole$ = combineLatest([this.cfEndpointService.currentUser$, users$]).pipe(
      map(([currentUser, users]) => {
        if (!users) return 'None';
        const me = users.find(u => u.guid === currentUser.guid);
        const roles = me?.orgRoles.find(r => r.orgGuid === this.orgGuid)?.roles ?? [];
        return getOrgRolesString(createUserRoleInOrg(
          roles.includes('manager'),
          roles.includes('billing_manager'),
          roles.includes('auditor'),
          roles.includes('user'),
        ));
      }),
    );
    this.usersCount$ = users$.pipe(
      map(users => {
        if (!users) return null;
        return users.filter(u => u.orgRoles.some(r => r.orgGuid === this.orgGuid)).length;
      }),
    );

    this.serviceInstancesCount = this.serviceCatalog.serviceInstanceCount(this.cfGuid, this.orgGuid).value;
    this.userProvidedServiceInstancesCount$ =
      this.cfUserProvidedServicesService.fetchUserProvidedServiceInstancesCount(this.cfGuid, this.orgGuid);

    this.routesCount$ = this.cfEndpointService.fetchRouteCount(
      this.activeRouteCfOrgSpace.orgGuid
    );
  }

  private initialiseSpaceObservables() {
    // V3-shape StSpace doesn't carry routes inline. The template binding
    // for `routes$` is unused after the V3 migration — leave a stub that
    // emits [] so legacy template branches continue to render "0 routes"
    // without dispatching anything.
    this.routes$ = this.spaces$.pipe(map((): APIResource<Route>[] => []));
  }

  private initialiseAppObservables() {
    // V3-native: filter foundation-wide apps stream by this org's space
    // guids. spaces$ is V3-shaped (StSpace, .guid not .metadata.guid).
    this.apps$ = combineLatest([this.cfEndpointService.apps$, this.spaces$]).pipe(
      filter(([apps, spaces]) => !!apps && !!spaces),
      map(([allApps, spaces]) => {
        const spaceGuids = new Set(spaces.map(s => s.guid));
        return allApps.filter(a => spaceGuids.has(a.entity.space_guid));
      }),
    );
    this.appInstances$ = this.apps$.pipe(
      filter($apps => !!$apps),
      map(getStartedAppInstanceCount)
    );

    this.totalMem$ = this.apps$.pipe(map(a => this.cfEndpointService.getMetricFromApps(a, 'memory')));

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
    return this.cfEndpointService.fetchAppCount(this.activeRouteCfOrgSpace.orgGuid);
  }

  private initialiseOrgObservables() {
    // V3-native: spaces come straight off the shared OrgDataService signal.
    this.orgDataService.load().subscribe({ error: () => {} });
    this.spaces$ = toObservable(this.orgDataService.spaces, { injector: this.injector }).pipe(
      filter(spaces => !!spaces),
    );

    // V3-native private domains: hit /pp/v1/cf/org/:cnsi/:orgGuid/private_domains
    // directly. Backend filters /v3/domains?organization_guids= to the
    // private subset. shareReplay so the Summary tile + breadcrumbs share
    // the single HTTP fetch.
    this.privateDomains$ = this.http.get<StPrivateDomainsResponse>(
      `/pp/v1/cf/org/${this.cfGuid}/${this.orgGuid}/private_domains`,
    ).pipe(
      map(resp => resp?.resources ?? []),
      catchError(() => EMPTY),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    // V3-native: org quota lookup via QuotaDataService. The signal source
    // returns null until the response lands; we filter to non-null so the
    // Observable emission semantics match the legacy entity-service path.
    const orgSnapshot$ = toObservable(this.orgDataService.org, { injector: this.injector }).pipe(
      filter((o): o is StOrgDetail => !!o),
    );
    this.quotaDefinition$ = orgSnapshot$.pipe(
      map(o => o.quotaGuid),
      filter(quotaGuid => !!quotaGuid),
      switchMap(quotaGuid => {
        const source = this.quotaData.orgQuota(this.cfGuid, quotaGuid);
        return toObservable(source.value, { injector: this.injector }).pipe(
          filter((q): q is StOrgQuota => !!q),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.quotaLink$ = orgSnapshot$.pipe(map(o => {
      const quotaDefinitionGuid = o.quotaGuid;
      return quotaDefinitionGuid ? [
        '/cloud-foundry',
        this.cfGuid,
        'organizations',
        this.orgGuid,
        'quota'
      ] : undefined;
    }));
  }
}
