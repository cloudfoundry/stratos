import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { firstValueFrom } from 'rxjs';

import { CfUsersSignalConfigService } from './cf-users-signal-config.service';
import { CfUsersPagedDataService } from '../../../../data-services/cf-users-paged-data.service';
import { CfUserListDiagnosticsService } from '../../../../../services/diagnostics/cf-user-list-diagnostics.service';
import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import { ListStateStore } from '@stratosui/core';

// ─── Stub factories ──────────────────────────────────────────────────────────

function makeDiagStub() {
  return {
    record: vi.fn(),
    setIdentity: vi.fn(),
    setDataSource: vi.fn(),
    ensure: vi.fn().mockReturnValue({ events: [] }),
    probe: vi.fn().mockReturnValue({}),
    history: vi.fn().mockReturnValue([]),
  };
}

function makeEndpointDataServiceStub() {
  return {
    guid: 'cf1',
    orgs: signal([]).asReadonly(),
    spaces: signal([]).asReadonly(),
    isLoadingOrgs: signal(false).asReadonly(),
    isLoadingSpaces: signal(false).asReadonly(),
    loadDetails: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    lastFetched: signal<Date | null>(null).asReadonly(),
    appCount: signal(0).asReadonly(),
    orgCount: signal(0).asReadonly(),
    routeCount: signal(0).asReadonly(),
    load: vi.fn(),
    loadServicesDetails: vi.fn().mockResolvedValue(undefined),
  };
}

function makeRegistryStub() {
  const endpointDataSvc = makeEndpointDataServiceStub();
  return {
    acquire: vi.fn().mockReturnValue(endpointDataSvc),
    release: vi.fn(),
    configure: vi.fn(),
  };
}

function makeListStateStoreStub() {
  const viewMode = signal<'card' | 'table'>('table');
  const pageSizeByMode = signal<readonly [number, number]>([24, 25]);
  const pageIndexByMode = signal<readonly [number, number]>([0, 0]);
  const sortByMode = signal<readonly [any, any]>([
    { field: 'username', direction: 'asc' },
    { field: 'username', direction: 'asc' },
  ]);
  const pageSize = signal(25);
  const pageIndex = signal(0);
  const sort = signal({ field: 'username', direction: 'asc' });

  return {
    bind: vi.fn().mockReturnValue({
      viewMode,
      pageSizeByMode,
      pageIndexByMode,
      sortByMode,
      pageSize,
      pageIndex,
      sort,
    }),
  };
}

// ─── Test constants ───────────────────────────────────────────────────────────

const CNSI = 'cf1';
const P1 = `/pp/v1/cf/users/${CNSI}?per_page=500&page=1`;
const P2 = `/pp/v1/cf/users/${CNSI}?per_page=500&page=2`;

const mkUser = (g: string) => ({
  guid: g,
  username: g,
  cnsiGuid: CNSI,
  orgRoles: [],
  spaceRoles: [],
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CfUsersSignalConfigService', () => {
  let svc: CfUsersSignalConfigService;
  let drainSvc: CfUsersPagedDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CfUsersSignalConfigService,
        CfUsersPagedDataService,
        { provide: CfUserListDiagnosticsService, useValue: makeDiagStub() },
        { provide: EndpointDataRegistry, useValue: makeRegistryStub() },
        { provide: ListStateStore, useValue: makeListStateStoreStub() },
      ],
    });

    svc = TestBed.inject(CfUsersSignalConfigService);
    drainSvc = TestBed.inject(CfUsersPagedDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('users() returns rows from ALL server pages (regression: was page-1-only)', async () => {
    // ARRANGE: initialize triggers the drain
    svc.initialize(CNSI);

    // Attach our own awaitable handle to the same in-flight share
    const loadDone = firstValueFrom(drainSvc.loadUsers(CNSI));

    // ACT: flush both pages through HttpTestingController
    http.expectOne(P1).flush({
      resources: [mkUser('alice')],
      pagination: { totalResults: 2, totalPages: 2 },
    });
    http.expectOne(P2).flush({
      resources: [mkUser('bob')],
      pagination: { totalResults: 2, totalPages: 2 },
    });
    await loadDone;

    // ASSERT: both pages present in users()
    const guids = svc.users().map(u => u.guid);
    expect(guids).toContain('alice');
    expect(guids).toContain('bob');
    expect(guids).toHaveLength(2);
  });

  it('org/space filtering still works after drain (ViewPipeline passthrough)', async () => {
    svc.initializeForSpace(CNSI, 'space-x');

    const loadDone = firstValueFrom(drainSvc.loadUsers(CNSI));
    http.expectOne(P1).flush({
      resources: [
        { ...mkUser('carol'), spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-x', roles: ['developer'] }] },
        { ...mkUser('dave'), spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-y', roles: ['developer'] }] },
      ],
      pagination: { totalResults: 2, totalPages: 1 },
    });
    await loadDone;

    // Only carol is in space-x
    const guids = svc.users().map(u => u.guid);
    expect(guids).toEqual(['carol']);
  });

  it('hasLoadedOnce becomes true once the drain completes', async () => {
    expect(svc.hasLoadedOnce()).toBe(false);

    svc.initialize(CNSI);
    // Attach an awaitable handle to the same shared in-flight observable
    const loadDone = firstValueFrom(drainSvc.loadUsers(CNSI));

    http.expectOne(P1).flush({
      resources: [mkUser('eve')],
      pagination: { totalResults: 1, totalPages: 1 },
    });
    await loadDone;

    expect(svc.hasLoadedOnce()).toBe(true);
  });
});
