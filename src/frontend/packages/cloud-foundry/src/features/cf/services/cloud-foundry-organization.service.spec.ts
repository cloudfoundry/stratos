import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentInjector, Injector, Signal, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APIResource } from '@stratosui/store';

import { IApp } from '../../../cf-api.types';
import { CfUsersPagedDataService } from '../../../shared/data-services/cf-users-paged-data.service';
import { OrgDataRegistry } from '../../../services/endpoint-data/org-data.registry';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';
import { StOrgDetail, StOrgQuota, StSpace, StUser } from '../../../services/endpoint-data/stratos-types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from './cloud-foundry-organization.service';

describe('CloudFoundryOrganizationService', () => {
  let org: ReturnType<typeof signal<StOrgDetail | null>>;
  let quota: ReturnType<typeof signal<StOrgQuota | null>>;
  // Each live signal-to-observable bridge reads the quota value once per
  // write, so the read count after one write is the number of live bridges.
  let quotaReads: number;
  // quota lookups made, one per quota the stream switched to
  let lookups: number;

  let users: WritableSignal<StUser[] | null>;
  let spaces: WritableSignal<StSpace[]>;
  let spacesSettled: WritableSignal<boolean>;
  let endpointApps: WritableSignal<APIResource<IApp>[]>;

  beforeEach(() => {
    endpointApps = signal<APIResource<IApp>[]>([]);
    users = signal<StUser[] | null>(null);
    spaces = signal<StSpace[]>([]);
    spacesSettled = signal(false);
    org = signal<StOrgDetail | null>(null);
    quota = signal<StOrgQuota | null>(null);
    quotaReads = 0;
    lookups = 0;
    const countedQuota = (() => {
      quotaReads++;
      return quota();
    }) as Signal<StOrgQuota | null>;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: 'cf-1', orgGuid: 'org-1' } },
        {
          provide: OrgDataRegistry,
          useValue: { acquire: () => ({ load: () => of(undefined), org, spaces, spacesSettled }) },
        },
        { provide: QuotaDataService, useValue: { orgQuota: () => { lookups++; return { value: countedQuota }; } } },
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
            apps$: of([]),
            hasApps$: of(false),
            appsLoading$: of(false),
            fetchAppCount: () => of(0),
            fetchRouteCount: () => of(0),
            getMetricFromApps: (apps: APIResource<IApp>[]) =>
              apps.reduce((total, a) => total + (a.entity.memory ?? 0) * (a.entity.instances ?? 0), 0),
          },
        },
        CloudFoundryOrganizationService,
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps one quota bridge alive however often the org re-emits', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const seen: StOrgQuota[] = [];
    const sub = svc.quotaDefinition$.subscribe(q => seen.push(q));

    // Each change of quota re-runs the switchMap, which builds a new
    // bridge to the quota signal.
    for (const quotaGuid of ['quota-a', 'quota-b', 'quota-1']) {
      org.set({ guid: 'org-1', name: 'a', quotaGuid } as StOrgDetail);
      TestBed.tick();
    }

    quotaReads = 0;
    const q = { guid: 'quota-1', name: 'default' } as StOrgQuota;
    quota.set(q);
    TestBed.tick();

    expect(quotaReads).toBe(1);
    expect(seen).toEqual([q]);
    sub.unsubscribe();
  });

  // The service is provided per org page. Each visit must leave nothing
  // behind once the page (and its service) is destroyed.
  it('leaves no quota bridge alive after the page is destroyed', () => {
    const root = TestBed.inject(EnvironmentInjector);
    for (let visit = 0; visit < 5; visit++) {
      const page = Injector.create({ providers: [{ provide: CloudFoundryOrganizationService }], parent: root }) as Injector & { destroy(): void };
      const svc = page.get(CloudFoundryOrganizationService);
      svc.quotaDefinition$.subscribe();
      org.set({ guid: 'org-1', name: 'a', quotaGuid: 'quota-1' } as StOrgDetail);
      TestBed.tick();
      page.destroy();
    }

    quotaReads = 0;
    quota.set({ guid: 'quota-1', name: 'default' } as StOrgQuota);
    TestBed.tick();

    expect(quotaReads).toBe(0);
  });

  it('looks the quota up again only when the quota changes', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const sub = svc.quotaDefinition$.subscribe();

    // A rename patches the org but keeps its quota
    for (const name of ['a', 'b', 'c']) {
      org.set({ guid: 'org-1', name, quotaGuid: 'quota-1' } as StOrgDetail);
      TestBed.tick();
    }

    expect(lookups).toBe(1);
    sub.unsubscribe();
  });

  // The tile shows a placeholder while the users cache loads; 'None' is
  // only for a user with no role here (it used to show 'None' for both).
  it('gives no role string while the users are loading', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const seen: (string | null)[] = [];
    const sub = svc.userOrgRole$.subscribe(r => seen.push(r));
    TestBed.tick();
    expect(seen.at(-1)).toBeNull();
    sub.unsubscribe();
  });

  it('says None once loaded when the user has no role here', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const seen: (string | null)[] = [];
    const sub = svc.userOrgRole$.subscribe(r => seen.push(r));
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', orgRoles: [], spaceRoles: [] }]);
    TestBed.tick();
    expect(seen.at(-1)).toBe('None');
    sub.unsubscribe();
  });

  it('names the user\'s role once loaded', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const seen: (string | null)[] = [];
    const sub = svc.userOrgRole$.subscribe(r => seen.push(r));
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', spaceRoles: [],
      orgRoles: [{ orgGuid: 'org-1', roles: ['auditor'] }] } as unknown as StUser]);
    TestBed.tick();
    expect(seen.at(-1)).toBe('Auditor');
    sub.unsubscribe();
  });

  // The Spaces tile and the org's apps (filtered by space) read spaces$; an
  // empty list before the spaces arrive read as "0 Spaces".
  it('emits the spaces only once they have arrived', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    const seen: StSpace[][] = [];
    const sub = svc.spaces$.subscribe(s => seen.push(s));
    TestBed.tick();
    expect(seen).toEqual([]);
    spaces.set([{ guid: 'sp-1', name: 'sp-1' } as StSpace]);
    spacesSettled.set(true);
    TestBed.tick();
    expect(seen.at(-1)?.map(s => s.guid)).toEqual(['sp-1']);
    sub.unsubscribe();
  });

  const app = (guid: string, spaceGuid: string, state: string, memory: number, instances: number) =>
    ({ metadata: { guid }, entity: { space_guid: spaceGuid, state, memory, instances } }) as unknown as APIResource<IApp>;

  // The org's apps are the foundation's apps in its spaces; until the spaces
  // arrive there is no list, so the tiles show placeholders rather than 0.
  it('lists the apps in the org\'s spaces once the spaces have arrived', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    endpointApps.set([
      app('a-1', 'sp-1', 'STARTED', 64, 2),
      app('a-2', 'sp-other', 'STARTED', 64, 1),
      app('a-3', 'sp-1', 'STOPPED', 128, 1),
    ]);
    expect(svc.apps()).toBeNull();
    expect(svc.appInstances()).toBeNull();
    expect(svc.totalMem()).toBeNull();

    spaces.set([{ guid: 'sp-1', name: 'sp-1' } as StSpace]);
    spacesSettled.set(true);

    expect(svc.apps()?.map(a => a.metadata.guid)).toEqual(['a-1', 'a-3']);
    expect(svc.appInstances()).toBe(2);
  });

  it('totals the memory of the org\'s apps', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    endpointApps.set([app('a-1', 'sp-1', 'STARTED', 64, 2), app('a-2', 'sp-other', 'STARTED', 512, 1)]);
    spaces.set([{ guid: 'sp-1', name: 'sp-1' } as StSpace]);
    spacesSettled.set(true);
    expect(svc.totalMem()).toBe(128);
  });

  // Same predicate as the org's Users tab: an org role or a space role here.
  it('counts users with an org role or a space role in this org', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    expect(svc.usersCount()).toBeNull();
    users.set([
      { guid: 'u-1', orgRoles: [{ orgGuid: 'org-1', roles: ['user'] }], spaceRoles: [] },
      { guid: 'u-2', orgRoles: [], spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'sp-1', roles: ['developer'] }] },
      { guid: 'u-3', orgRoles: [{ orgGuid: 'org-2', roles: ['user'] }], spaceRoles: [] },
    ] as unknown as StUser[]);
    expect(svc.usersCount()).toBe(2);
  });

  it('links to the quota page only when the org has a quota', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    org.set({ guid: 'org-1', name: 'a', quotaGuid: '' } as StOrgDetail);
    expect(svc.quotaLink()).toBeUndefined();
    org.set({ guid: 'org-1', name: 'a', quotaGuid: 'quota-1' } as StOrgDetail);
    expect(svc.quotaLink()).toEqual(['/cloud-foundry', 'cf-1', 'organizations', 'org-1', 'quota']);
  });
});
