import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentInjector, Injector, WritableSignal, signal } from '@angular/core';
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
  // quota lookups made, one per quota the org switched to
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
    lookups = 0;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: 'cf-1', orgGuid: 'org-1' } },
        {
          provide: OrgDataRegistry,
          useValue: { acquire: () => ({ load: () => of(undefined), org, spaces, spacesSettled }) },
        },
        { provide: QuotaDataService, useValue: { orgQuota: () => { lookups++; return { value: quota }; } } },
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

  it('gives the quota once it has loaded', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    org.set({ guid: 'org-1', name: 'a', quotaGuid: 'quota-1' } as never);
    TestBed.tick();
    expect(svc.quotaDefinition()).toBeNull();

    const q = { guid: 'quota-1', name: 'small' } as StOrgQuota;
    quota.set(q);
    expect(svc.quotaDefinition()).toEqual(q);
  });

  // The quota stayed on screen after it was taken off.
  it('has no quota once the org has none', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    org.set({ guid: 'org-1', name: 'a', quotaGuid: 'quota-1' } as never);
    quota.set({ guid: 'quota-1', name: 'small' } as StOrgQuota);
    TestBed.tick();
    expect(svc.quotaDefinition()).not.toBeNull();

    org.set({ guid: 'org-1', name: 'a' } as never);
    TestBed.tick();
    expect(svc.quotaDefinition()).toBeNull();
  });

  // The service is provided per org page. Each visit must leave nothing
  // behind once the page (and its service) is destroyed.
  it('stops looking quotas up after the page is destroyed', () => {
    const root = TestBed.inject(EnvironmentInjector);
    const page = Injector.create({ providers: [{ provide: CloudFoundryOrganizationService }], parent: root }) as Injector & { destroy(): void };
    page.get(CloudFoundryOrganizationService);
    org.set({ guid: 'org-1', name: 'a', quotaGuid: 'quota-1' } as never);
    TestBed.tick();
    page.destroy();

    lookups = 0;
    org.set({ guid: 'org-1', name: 'a', quotaGuid: 'quota-2' } as never);
    TestBed.tick();

    expect(lookups).toBe(0);
  });

  it('looks the quota up again only when the quota changes', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    svc.quotaDefinition();

    // A rename patches the org but keeps its quota
    for (const name of ['a', 'b', 'c']) {
      org.set({ guid: 'org-1', name, quotaGuid: 'quota-1' } as never);
      TestBed.tick();
    }

    expect(lookups).toBe(1);
  });

  // The tile shows a placeholder while the users cache loads; 'None' is
  // only for a user with no role here (it used to show 'None' for both).
  it('gives no role string while the users are loading', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    expect(svc.userOrgRole()).toBeNull();
  });

  it('says None once loaded when the user has no role here', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', orgRoles: [], spaceRoles: [] }]);
    expect(svc.userOrgRole()).toBe('None');
  });

  it('names the user\'s role once loaded', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', spaceRoles: [],
      orgRoles: [{ orgGuid: 'org-1', roles: ['auditor'] }] } as unknown as StUser]);
    expect(svc.userOrgRole()).toBe('Auditor');
  });

  // The Spaces tile and the org's apps (filtered by space) read spaces; an
  // empty list before the spaces arrive read as "0 Spaces".
  it('gives the spaces only once they have arrived', () => {
    const svc = TestBed.inject(CloudFoundryOrganizationService);
    expect(svc.spaces()).toBeNull();
    spaces.set([{ guid: 'sp-1', name: 'sp-1' } as StSpace]);
    spacesSettled.set(true);
    expect(svc.spaces()?.map(s => s.guid)).toEqual(['sp-1']);
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
