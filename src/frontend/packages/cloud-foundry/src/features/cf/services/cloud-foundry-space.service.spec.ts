import { Signal, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

describe('CloudFoundrySpaceService — spaceQuotaDefinition$', () => {
  let space: ReturnType<typeof signal<StSpace | null>>;
  let quota: ReturnType<typeof signal<StSpaceQuota | null>>;
  // Each live signal-to-observable bridge reads the quota value once per
  // write, so the read count after one write is the number of live bridges.
  let quotaReads: number;
  // quota lookups made, one per quota the stream switched to
  let lookups: number;

  let users: WritableSignal<StUser[] | null>;

  beforeEach(() => {
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
            currentUser$: of({ guid: 'me' }),
            apps$: of([]),
            hasApps$: of(false),
            appsLoading$: of(false),
            fetchAppCount: () => of(0),
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
    const seen: (string | null)[] = [];
    const sub = svc.userRole$.subscribe(r => seen.push(r));
    TestBed.tick();
    expect(seen.at(-1)).toBeNull();
    sub.unsubscribe();
  });

  it('says None once loaded when the user has no role here', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    const seen: (string | null)[] = [];
    const sub = svc.userRole$.subscribe(r => seen.push(r));
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', orgRoles: [], spaceRoles: [] }]);
    TestBed.tick();
    expect(seen.at(-1)).toBe('None');
    sub.unsubscribe();
  });

  it('names the user\'s role once loaded', () => {
    const svc = TestBed.inject(CloudFoundrySpaceService);
    const seen: (string | null)[] = [];
    const sub = svc.userRole$.subscribe(r => seen.push(r));
    users.set([{ guid: 'me', username: 'me', cnsiGuid: 'cf-1', orgRoles: [], spaceRoles: [],
      spaceRoles: [{ spaceGuid: 'space-1', roles: ['developer'] }] } as unknown as StUser]);
    TestBed.tick();
    expect(seen.at(-1)).toBe('Developer');
    sub.unsubscribe();
  });
});
