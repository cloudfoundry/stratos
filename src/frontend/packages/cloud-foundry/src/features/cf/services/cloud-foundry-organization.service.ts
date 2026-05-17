import { Injectable, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Route } from '@angular/router';
import { Store } from '@stratosui/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { OrgDataRegistry } from '../../../services/endpoint-data/org-data.registry';
import { StOrgDetail } from '../../../services/endpoint-data/stratos-types';
import { createUserRoleInOrg } from '../../../store/types/cf-user.types';

import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../store/src/types/api.types';
import {
  IApp,
  IDomain,
  IOrgQuotaDefinition,
  ISpace,
  ISpaceQuotaDefinition,
} from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import {
  organizationEntityType,
} from '../../../cf-entity-types';
import { getEntityFlattenedList, getStartedAppInstanceCount } from '../../../cf.helpers';
import { createEntityRelationPaginationKey } from '../../../entity-relations/entity-relations.types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { fetchServiceInstancesCount } from '../../service-catalog/services-helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getOrgRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

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
  private store = inject<Store<CFAppState>>(Store);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private cfUserProvidedServicesService = inject(CloudFoundryUserProvidedServicesService);
  private cnsiUsers = inject(CnsiUsersSnapshotService);
  private orgDataRegistry = inject(OrgDataRegistry);
  private injector = inject(Injector);

  // Registry returns the same instance as the org-base component's provider,
  // so reads here hit the shared, in-flight-deduped signal — no extra HTTP.
  readonly orgDataService = this.orgDataRegistry.acquire(
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.orgGuid,
  );

  orgGuid: string;
  cfGuid: string;
  quotaLink$!: Observable<string[]>;
  userOrgRole$!: Observable<string>;
  quotaDefinition$!: Observable<IOrgQuotaDefinition>;
  totalMem$!: Observable<number>;
  // V3-native: domain entity returns IDomain shape (V3 unified model)
  // rather than V2's IPrivateDomain. Template only reads .length, so the
  // shape difference is invisible to consumers.
  privateDomains$!: Observable<APIResource<IDomain>[]>;
  routes$!: Observable<APIResource<Route>[]>;
  serviceInstancesCount$!: Observable<number>;
  userProvidedServiceInstancesCount$!: Observable<number>;
  routesCount$!: Observable<number>;
  spaces$!: Observable<APIResource<ISpace>[]>;
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

  public deleteSpace(spaceGuid: string, orgGuid: string, endpointGuid: string) {
    cfEntityCatalog.space.api.remove(spaceGuid, endpointGuid, { orgGuid });
  }

  public fetchApps() {
    this.cfEndpointService.fetchApps();
  }

  private initialiseObservables() {
    this.initialiseOrgObservables();

    this.initialiseAppObservables();

    this.initialiseSpaceObservables();

    // V3-native: read role buckets from the StUser snapshot instead of the
    // V2-shape cfUserService helpers (which inspect user.managed_organizations
    // etc. — fields the V3 wire no longer carries). Snapshot is lazy so the
    // home-page cache is unaffected; only the Summary tile triggers the
    // /pp/v1/cf/users/:cnsi fetch.
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
    // null = snapshot not yet loaded → render "-" placeholder, otherwise
    // count users with at least one org-role bucket for this org.
    this.usersCount$ = users$.pipe(
      map(users => {
        if (!users) return null;
        return users.filter(u => u.orgRoles.some(r => r.orgGuid === this.orgGuid)).length;
      }),
    );

    this.serviceInstancesCount$ = fetchServiceInstancesCount(this.cfGuid, this.orgGuid, null, this.store, this.paginationMonitorFactory);
    this.userProvidedServiceInstancesCount$ =
      this.cfUserProvidedServicesService.fetchUserProvidedServiceInstancesCount(this.cfGuid, this.orgGuid);

    this.routesCount$ = CloudFoundryEndpointService.fetchRouteCount(
      this.store,
      this.paginationMonitorFactory,
      this.activeRouteCfOrgSpace.cfGuid,
      this.activeRouteCfOrgSpace.orgGuid
    );
  }

  private initialiseSpaceObservables() {
    this.routes$ = this.spaces$.pipe(this.getFlattenedList('routes'));
  }

  private initialiseAppObservables() {
    // V3-native: org no longer carries inline spaces, so getAppsInOrgViaAllApps
    // (which reads org.entity.spaces) returns empty. Filter the foundation-wide
    // apps stream against the org's spaces$ list instead — same intent, V3-shape
    // org compatible. apps$ remains V2-shaped for now since /pp/v1/proxy/v2/apps
    // is the data source.
    this.apps$ = combineLatest([this.cfEndpointService.apps$, this.spaces$]).pipe(
      filter(([apps, spaces]) => !!apps && !!spaces),
      map(([allApps, spaces]) => {
        const spaceGuids = new Set(spaces.map(s => s.metadata.guid));
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
    return CloudFoundryEndpointService.fetchAppCount(
      this.store,
      this.paginationMonitorFactory,
      this.activeRouteCfOrgSpace.cfGuid,
      this.activeRouteCfOrgSpace.orgGuid
    );
  }


  private initialiseOrgObservables() {
    // V3-native: org no longer carries inline spaces. Use the entity-catalog
    // pagination helper (same path add-edit-space-step-base + Spaces tab share)
    // — proven to dispatch the action and surface entities reliably.
    this.spaces$ = cfEntityCatalog.space.store.getAllInOrganization.getPaginationService(
      this.orgGuid,
      this.cfGuid,
      createEntityRelationPaginationKey(organizationEntityType, this.orgGuid),
      { flatten: true },
    ).entities$.pipe(
      filter(spaces => !!spaces),
    );
    // V3-native: org no longer carries inline private_domains. Fetch via
    // /pp/v1/cf/org/:cnsi/:orgGuid/private_domains (handler filters
    // /v3/domains?organization_guids=:guid down to the private subset).
    this.privateDomains$ = cfEntityCatalog.domain.store.getOrganizationDomains.getPaginationService(
      this.orgGuid, this.cfGuid,
    ).entities$.pipe(filter(domains => !!domains));

    // V3-native: org no longer carries inline quota_definition. The
    // quotaGuid field (mapped from V3 relationships.quota.data.guid by the
    // native handler) drives a separate cfEntityCatalog fetch — same
    // pattern as features/cf/quota-definition/quota-definition.component.ts.
    const orgSnapshot$ = toObservable(this.orgDataService.org, { injector: this.injector }).pipe(
      filter((o): o is StOrgDetail => !!o),
    );
    // shareReplay so the 4 subscribers on space-detail summary (template
    // quotaDefinition$ async-pipe, quotaLink$ combineLatest, plus space-
    // service.spaceQuotaDefinition$ fallback chain) share one
    // getEntityService(...) subscription instead of each dispatching a
    // separate /organization_quotas/{guid} fetch.
    this.quotaDefinition$ = orgSnapshot$.pipe(
      map(o => o.quotaGuid),
      filter(quotaGuid => !!quotaGuid),
      switchMap(quotaGuid =>
        cfEntityCatalog.quotaDefinition.store.getEntityService(quotaGuid, this.cfGuid, {}).waitForEntity$
      ),
      map(qe => qe.entity.entity),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.quotaLink$ = orgSnapshot$.pipe(map(o => {
      const quotaDefinitionGuid = o.quotaGuid;
      return quotaDefinitionGuid && [
        '/cloud-foundry',
        this.cfGuid,
        'organizations',
        this.orgGuid,
        'quota'
      ];
    }));
  }

  private getFlattenedList(property: string): (source: Observable<APIResource<any>[]>) => Observable<any> {
    return map(entities => getEntityFlattenedList(property, entities));
  }
}
