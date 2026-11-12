import { EnvironmentInjector, Injector, Signal, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APIResource } from '@stratosui/store';

import { IApp } from '../../../cf-api.types';

import { CfUsersPagedDataService } from '../../../shared/data-services/cf-users-paged-data.service';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../services/endpoint-data/space-data.registry';
import { StSpace, StSpaceQuota, StUser } from '../../../services/endpoint-data/stratos-types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from './cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from './cloud-foundry-space.service';

describe('CloudFoundrySpaceService', () => {
  let space: ReturnType<typeof signal<StSpace | null>>;
  let quota: ReturnType<typeof signal<StSpaceQuota | null>>;
  // Each live signal-to-observable bridge reads the quota value once per
  // write, so the read count after one write is the number of live bridges.
  let quotaReads: number;
  // quota lookups made, one per quota the stream switched to
  let lookups: number;

  let users: WritableSignal<StUser[] | null>;
  let endpointApps: WritableSignal<APIResource<IApp>[]>;

  beforeEach(() => {
    endpointApps = signal<APIResource<IApp>[]>([]);
    users = signal<StUser[] | null>(null);
    space = signal<StSpace | null>(null);
    quota = signal<StSpaceQuota | null>(null);
    quotaReads = 0;
    lookups = 0;
    const countedQuota = (() => {
      quotaReads++;
      return quota();
    }) as Signal<StSpaceQuota | null>;

    TestBed.configureTestingModule({
      providers: [
        { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: 'cf-1', orgGuid: 'org-1', spaceGuid: 'space-1' } },
        {
          provide: SpaceDataRegistry,
          useValue: { acquire: () => ({ load: () => of(undefined), space }) },
        },
        { provide: QuotaDataService, useValue: { spaceQuota: () => { lookups++; return { value: countedQuota }; } } },
        { provide: CloudFoundryOrganizationService, useValue: { quotaDefinition$: of(null) } },
        { provide: CfUsersPagedDataService, useValue: { users: () => users } },
        { provide: ServiceCatalogDataService, useValue: { serviceInstanceCount: () => ({ value: signal(0) }) } },
        {
          provide: CloudFoundryUserProvidedServicesService,
          useValue: { fetchUserProvidedServiceInstancesCount: () => of(0) },
        },
        {
          provide: CloudFoundryEndpointService,
          useValue: {
            endpoint: signal({ entity: { user: { guid: 'me' } } }),
            apps: endpointApps,
            appsLoading: signal(false),
            getMetricFromApps: (apps: APIResource<IApp>[]) =>
              apps.reduce((total, a) => total + (a.entity.memory ?? 0) * (a.entity.instances ?? 0), 0),
          },
        },
        CloudFoundrySpaceService,
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps one quota bridge alive however often the space re-emits', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    const seen: (StSpaceQuota | null)[] = [];
    const sub = svc.spaceQuotaDefinition$.subscribe(q => seen.push(q));

    // Each change of quota re-runs the switchMap, which builds a new
    // bridge to the quota signal.
    for (const quotaGuid of ['quota-a', 'quota-b', 'quota-1']) {
      space.set({ guid: 'space-1', name: 'a', quotaGuid } as StSpace);
      TestBed.tick();
    }

    quotaReads = 0;
    const q = { guid: 'quota-1', name: 'small' } as StSpaceQuota;
    quota.set(q);
    TestBed.tick();

    expect(quotaReads).toBe(1);
    expect(seen.at(-1)).toEqual(q);
    sub.unsubscribe();
  });

  // The service is provided per space page. Each visit must leave nothing
  // behind once the page (and its service) is destroyed.
  it('leaves no quota bridge alive after the page is destroyed', () => {
    const root = TestBed.inject(EnvironmentInjector);
    for (let visit = 0; visit < 5; visit++) {
      const page = Injector.create({ providers: [{ provide: CloudFoundrySpaceService }], parent: root }) as Injector & { destroy(): void };
      const svc = page.get(CloudFoundrySpaceService);
      svc.spaceQuotaDefinition$.subscribe();
      space.set({ guid: 'space-1', name: 'a', quotaGuid: 'quota-1' } as StSpace);
      TestBed.tick();
      page.destroy();
    }

    quotaReads = 0;
    quota.set({ guid: 'quota-1', name: 'small' } as StSpaceQuota);
    TestBed.tick();

    expect(quotaReads).toBe(0);
  });

  it('keeps the quota alive for a later subscriber while the page lives', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    space.set({ guid: 'space-1', name: 'a', quotaGuid: 'quota-1' } as StSpace);
    svc.spaceQuotaDefinition$.subscribe().unsubscribe();
    TestBed.tick();
    const q = { guid: 'quota-1', name: 'small' } as StSpaceQuota;
    quota.set(q);
    TestBed.tick();

    const seen: (StSpaceQuota | null)[] = [];
    svc.spaceQuotaDefinition$.subscribe(v => seen.push(v));
    expect(seen.at(-1)).toEqual(q);
  });

  it('looks the quota up again only when the quota changes', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    const sub = svc.spaceQuotaDefinition$.subscribe();

    // A rename patches the space but keeps its quota
    for (const name of ['a', 'b', 'c']) {
      space.set({ guid: 'space-1', name, quotaGuid: 'quota-1' } as StSpace);
      TestBed.tick();
    }

    expect(lookups).toBe(1);
    sub.unsubscribe();
  });

  // The tile shows a placeholder while the users cache loads; 'None' is
  // only for a user with no role here (it used to show 'None' for both).
  it('gives no role string while the users are loading', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    expect(svc.userRole()).toBeNull();
  });

  it('says None once loaded when the user has no role here', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', orgRoles: [], spaceRoles: [] }]);
    expect(svc.userRole()).toBe('None');
  });

  it('names the user\'s role once loaded', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', orgRoles: [],
      spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-1', roles: ['developer'] }] }]);
    expect(svc.userRole()).toBe('Developer');
  });

  const app = (guid: string, spaceGuid: string, state: string, memory: number, instances: number) =>
    ({ metadata: { guid }, entity: { space_guid: spaceGuid, state, memory, instances } }) as unknown as APIResource<IApp>;

  it('lists the foundation\'s apps in this space and counts their started instances', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    endpointApps.set([
      app('a-1', 'space-1', 'STARTED', 64, 2),
      app('a-2', 'space-other', 'STARTED', 64, 1),
      app('a-3', 'space-1', 'STOPPED', 128, 1),
    ]);
    expect(svc.apps().map(a => a.metadata.guid)).toEqual(['a-1', 'a-3']);
    expect(svc.appInstances()).toBe(2);
  });

  it('totals the memory of the space\'s apps', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    endpointApps.set([app('a-1', 'space-1', 'STARTED', 64, 2), app('a-2', 'space-other', 'STARTED', 512, 1)]);
    expect(svc.totalMem()).toBe(128);
  });

  it('counts users with a role in this space', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    expect(svc.usersCount()).toBeNull();
    users.set([
      { guid: 'u-1', orgRoles: [], spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-1', roles: ['developer'] }] },
      { guid: 'u-2', orgRoles: [{ orgGuid: 'org-1', roles: ['user'] }], spaceRoles: [] },
      { guid: 'u-3', orgRoles: [], spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-2', roles: ['manager'] }] },
    ] as unknown as StUser[]);
    expect(svc.usersCount()).toBe(1);
  });

  // No space yet: the Routes tile shows its placeholder, not 0.
  it('counts the space\'s routes once the space has arrived', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    expect(svc.routesCount()).toBeNull();
    space.set({ guid: 'space-1', name: 'a', routeCount: 3 } as StSpace);
    expect(svc.routesCount()).toBe(3);
  });
});
