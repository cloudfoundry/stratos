import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, Injector, Signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { observeSignal } from '@stratosui/store';
import { EMPTY, Observable } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { CfUsersPagedDataService } from '../../../shared/data-services/cf-users-paged-data.service';
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
  private cnsiUsers = inject(CfUsersPagedDataService);
  private orgDataRegistry = inject(OrgDataRegistry);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  readonly orgDataService = this.orgDataRegistry.acquire(
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.orgGuid,
  );

  orgGuid: string;
  cfGuid: string;

  // The HTTP-backed members (quota, route, private domain and user-provided
  // service counts) stay Observables: this service lives on every org and
  // space page, so a reader turns them into signals where it needs them and
  // the requests go out only from the pages that show them.
  spaces!: Signal<StSpace[] | null>;
  apps!: Signal<APIResource<IApp>[] | null>;
  appInstances!: Signal<number | null>;
  totalMem!: Signal<number | null>;
  loadingApps!: Signal<boolean>;
  usersCount!: Signal<number | null>;
  userOrgRole!: Signal<string | null>;
  quotaLink!: Signal<string[] | undefined>;

  // V3-shape — quotaDefinition$ now emits StOrgQuota directly. Consumers
  // that previously read V2 fields (memory_limit, etc.) must read the V3
  // camelCase equivalents (totalMemoryInMB, etc.). Backwards-compat shim
  // lives in space-detail template which still mixes IOrgQuotaDefinition
  // for the union with space-quota fallback.
  quotaDefinition$!: Observable<StOrgQuota>;
  // V3-native: signal of StPrivateDomain[] surfaced as Observable for
  // template binding compatibility. Downstream only reads .length.
  privateDomains$!: Observable<StPrivateDomain[]>;
  serviceInstancesCount!: Signal<number>;
  userProvidedServiceInstancesCount$!: Observable<number>;
  routesCount$!: Observable<number>;

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.initialiseObservables();
  }

  public fetchApps() {
    this.cfEndpointService.fetchApps();
  }

  private initialiseObservables() {
    this.initialiseOrgObservables();
    this.initialiseAppObservables();

    const users = this.cnsiUsers.users(this.cfGuid);
    this.userOrgRole = computed(() => {
      const all = users();
      const currentUser = this.cfEndpointService.endpoint()?.entity.user;
      // Still loading: the tile shows its placeholder, not 'None'.
      if (!all || !currentUser) return null;
      const me = all.find(u => u.guid === currentUser.guid);
      const roles = me?.orgRoles.find(r => r.orgGuid === this.orgGuid)?.roles ?? [];
      return getOrgRolesString(createUserRoleInOrg(
        roles.includes('manager'),
        roles.includes('billing_manager'),
        roles.includes('auditor'),
        roles.includes('user'),
      ));
    });
    // Same membership predicate as the per-org Users tab
    // (CfUsersSignalConfigService org lock): an org role OR a space role
    // under one of the org's spaces. Counting orgRoles alone undercounts
    // whenever a user's only grant is space-scoped (#5805).
    this.usersCount = computed(() => {
      const all = users();
      if (!all) return null;
      return all.filter(u =>
        u.orgRoles.some(r => r.orgGuid === this.orgGuid) ||
        u.spaceRoles.some(r => r.orgGuid === this.orgGuid),
      ).length;
    });

    // Quota tile: managed only — user-provided instances don't count
    // against the service-instance quota (#5769); they get their own tile.
    this.serviceInstancesCount = this.serviceCatalog.serviceInstanceCount(this.cfGuid, this.orgGuid, undefined, 'managed').value;
    this.userProvidedServiceInstancesCount$ =
      this.cfUserProvidedServicesService.fetchUserProvidedServiceInstancesCount(this.cfGuid, this.orgGuid);

    this.routesCount$ = this.cfEndpointService.fetchRouteCount(
      this.activeRouteCfOrgSpace.orgGuid
    );
  }

  private initialiseAppObservables() {
    // The foundation-wide apps filtered to this org's spaces; null until the
    // spaces have arrived, so the tiles show placeholders rather than 0.
    this.apps = computed(() => {
      const spaces = this.spaces();
      if (!spaces) return null;
      const spaceGuids = new Set(spaces.map(s => s.guid));
      return this.cfEndpointService.apps().filter(a => spaceGuids.has(a.entity.space_guid));
    });
    this.appInstances = computed(() => {
      const apps = this.apps();
      return apps ? getStartedAppInstanceCount(apps) : null;
    });
    this.totalMem = computed(() => {
      const apps = this.apps();
      return apps ? this.cfEndpointService.getMetricFromApps(apps, 'memory') : null;
    });
    this.loadingApps = this.cfEndpointService.appsLoading;
  }

  private initialiseOrgObservables() {
    // V3-native: spaces come straight off the shared OrgDataService signal.
    this.orgDataService.load().subscribe({ error: () => {} });
    // Held back until the spaces have arrived: the Spaces tile shows its
    // placeholder, not "0", and the org's apps (filtered by space) wait too.
    this.spaces = computed(() => (this.orgDataService.spacesSettled() ? this.orgDataService.spaces() : null));

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
      // A rename patches the org but keeps its quota
      distinctUntilChanged(),
      // observeSignal, not toObservable: toObservable's effect would outlive
      // switchMap's unsubscribe, so each org re-emission (load, patch after
      // an edit) would add one more effect for the life of the page.
      switchMap(quotaGuid => {
        const source = this.quotaData.orgQuota(this.cfGuid, quotaGuid);
        return observeSignal(source.value, this.injector).pipe(
          filter((q): q is StOrgQuota => !!q),
        );
      }),
      // observeSignal ends only on unsubscribe and shareReplay keeps its one
      // subscription, so end it with the page that owns this service.
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.quotaLink = computed(() => this.orgDataService.org()?.quotaGuid ? [
      '/cloud-foundry',
      this.cfGuid,
      'organizations',
      this.orgGuid,
      'quota'
    ] : undefined);
  }
}
