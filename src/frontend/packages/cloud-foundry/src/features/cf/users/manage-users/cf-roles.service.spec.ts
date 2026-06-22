import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { filter, take, toArray } from 'rxjs/operators';
import { describe, it, expect, beforeEach } from 'vitest';

import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import {
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { StUser } from '../../../../services/endpoint-data/stratos-types';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfRolesService } from './cf-roles.service';

const stUser = (over: Partial<StUser>): StUser => ({
  guid: 'user-1',
  username: 'alice',
  cnsiGuid: 'cf-1',
  orgRoles: [],
  spaceRoles: [],
  ...over,
});

describe('CfRolesService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        CfRolesService,
        ...cfCurrentUserPermissionsService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    const service = TestBed.inject(CfRolesService);
    expect(service).toBeTruthy();
  });

  it('fetchOrg adapts native StOrgDetail into V2 APIResource shape with fetching/loaded emissions', async () => {
    const service = TestBed.inject(CfRolesService);
    const emissions = firstValueFrom(service.fetchOrg('cf-1', 'org-1').pipe(take(2), toArray()));

    const req = httpMock.expectOne('/pp/v1/cf/org/cf-1/org-1');
    expect(req.request.method).toBe('GET');
    req.flush({
      guid: 'org-1',
      name: 'My Org',
      cnsiGuid: 'cf-1',
      status: 'active',
      labels: {},
      annotations: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      quotaGuid: '',
      spaces: [],
    });

    const [first, second] = await emissions;
    expect(first.entityRequestInfo.fetching).toBe(true);
    expect(first.entity).toBeNull();
    expect(second.entityRequestInfo.fetching).toBe(false);
    // strict: the loaded emission (fetching=false) always carries a non-null entity
    expect(second.entity!.metadata.guid).toBe('org-1');
    expect(second.entity!.entity.name).toBe('My Org');
  });

  it('fetchOrgs hits the native list endpoint with per_page paging', () => {
    const service = TestBed.inject(CfRolesService);
    // Subscribe to trigger the http fetch — the downstream
    // filterEditableOrgOrSpace chain runs permission checks that aren't this
    // spec's subject. We only assert the request shape from the new adapter.
    service.fetchOrgs('cf-2').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/pp/v1/cf/orgs/cf-2?per_page=500');
    expect(req.request.method).toBe('GET');
    req.flush({ resources: [], totalResults: 0 });
  });

  it('fetchOrg degrades to error envelope on HTTP failure', async () => {
    const service = TestBed.inject(CfRolesService);
    const emissions = firstValueFrom(
      service.fetchOrg('cf-3', 'org-3').pipe(
        filter(e => !e.entityRequestInfo.fetching),
        take(1),
      ),
    );

    const req = httpMock.expectOne('/pp/v1/cf/org/cf-3/org-3');
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    const settled = await emissions;
    expect(settled.entity).toBeNull();
    expect(settled.entityRequestInfo.error).toBe(true);
  });

  it('populateRoles derives org+space permissions from StUser buckets and grafts spaces under their org', async () => {
    const service = TestBed.inject(CfRolesService);
    const user = stUser({
      guid: 'user-1',
      orgRoles: [{ orgGuid: 'org-1', roles: ['manager', 'user'] }],
      spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-1', roles: ['developer'] }],
    });

    const result = firstValueFrom(service.populateRoles('cf-1', [user]).pipe(take(1)));

    // Names are sourced via the native list endpoints (no per-user re-fetch),
    // drained page-by-page (page 1 here covers the full result set).
    httpMock.expectOne('/pp/v1/cf/orgs/cf-1?per_page=500&page=1')
      .flush({ resources: [{ guid: 'org-1', name: 'My Org', cnsiGuid: 'cf-1' }], totalResults: 1 });
    httpMock.expectOne('/pp/v1/cf/spaces/cf-1?per_page=500&page=1')
      .flush({ resources: [{ guid: 'space-1', name: 'My Space', orgGuid: 'org-1', cnsiGuid: 'cf-1' }], totalResults: 1 });

    const roles = await result;
    const org = roles['user-1']['org-1'];
    expect(org.orgGuid).toBe('org-1');
    expect(org.permissions.managers).toBe(true);
    expect(org.permissions.users).toBe(true);
    expect(org.permissions.auditors).toBe(false);

    // strict: this user has a space-1 role under org-1, so spaces is populated
    const space = org.spaces!['space-1'];
    expect(space.spaceGuid).toBe('space-1');
    expect(space.name).toBe('My Space');
    expect(space.permissions.developers).toBe(true);
    expect(space.permissions.managers).toBe(false);
  });

  it('populateRoles auto-creates an org bucket for a space-only role and keys by user guid', async () => {
    const service = TestBed.inject(CfRolesService);
    const user = stUser({
      guid: 'user-9',
      orgRoles: [],
      spaceRoles: [{ orgGuid: 'org-2', spaceGuid: 'space-2', roles: ['auditor'] }],
    });

    const result = firstValueFrom(service.populateRoles('cf-1', [user]).pipe(take(1)));

    httpMock.expectOne('/pp/v1/cf/orgs/cf-1?per_page=500&page=1')
      .flush({ resources: [], totalResults: 0 });
    httpMock.expectOne('/pp/v1/cf/spaces/cf-1?per_page=500&page=1')
      .flush({ resources: [{ guid: 'space-2', name: 'Space Two', orgGuid: 'org-2', cnsiGuid: 'cf-1' }], totalResults: 1 });

    const roles = await result;
    expect(Object.keys(roles)).toEqual(['user-9']);
    const org = roles['user-9']['org-2'];
    expect(org).toBeTruthy();
    // strict: the space-only role auto-creates org-2 with a populated spaces map
    expect(org.spaces!['space-2'].permissions.auditors).toBe(true);
    expect(org.spaces!['space-2'].name).toBe('Space Two');
  });

  it('populateRoles drains all org pages so names beyond the first page still resolve', async () => {
    const service = TestBed.inject(CfRolesService);
    const user = stUser({
      guid: 'user-1',
      orgRoles: [{ orgGuid: 'org-far', roles: ['manager'] }],
    });

    const result = firstValueFrom(service.populateRoles('cf-1', [user]).pipe(take(1)));

    // totalResults > per_page forces a second page; the user's org lives there.
    httpMock.expectOne('/pp/v1/cf/orgs/cf-1?per_page=500&page=1')
      .flush({ resources: [], totalResults: 600 });
    httpMock.expectOne('/pp/v1/cf/orgs/cf-1?per_page=500&page=2')
      .flush({ resources: [{ guid: 'org-far', name: 'Far Org', cnsiGuid: 'cf-1' }], totalResults: 600 });
    httpMock.expectOne('/pp/v1/cf/spaces/cf-1?per_page=500&page=1')
      .flush({ resources: [], totalResults: 0 });

    const roles = await result;
    expect(roles['user-1']['org-far'].name).toBe('Far Org');
    expect(roles['user-1']['org-far'].permissions.managers).toBe(true);
  });

  it('populateRoles returns empty for no selected users', async () => {
    const service = TestBed.inject(CfRolesService);
    const roles = await firstValueFrom(service.populateRoles('cf-1', []).pipe(take(1)));
    expect(roles).toEqual({});
    httpMock.expectNone('/pp/v1/cf/orgs/cf-1?per_page=500&page=1');
  });

  // ── drainCfList pagination ──────────────────────────────────────────────────

  it('drainCfList (via fetchSpacesForOrg): totalResults absent — fetches page 2 when page 1 is full and returns all org spaces sorted', async () => {
    // fetchSpacesForOrg uses the per-org endpoint /pp/v1/cf/org/<cf>/<org>/spaces
    // (NOT the old /pp/v1/cf/spaces/<cf> endpoint).  When page 1 is full (500 items)
    // it must fetch page 2.  All resources are returned (no org-guid filter —
    // server already scopes by org).
    const service = TestBed.inject(CfRolesService);

    // Make 500 spaces for page 1, plus target spaces on page 2
    const page1Spaces = Array.from({ length: 500 }, (_, i) => ({
      guid: `space-p1-${i}`,
      name: `Space P1 ${i}`,
      orgGuid: 'org-B',
      cnsiGuid: 'cf-drain',
    }));
    const page2Spaces = [
      { guid: 'space-target', name: 'Target Space', orgGuid: 'org-B', cnsiGuid: 'cf-drain' },
      ...Array.from({ length: 9 }, (_, i) => ({
        guid: `space-p2-${i}`,
        name: `Space P2 ${i}`,
        orgGuid: 'org-B',
        cnsiGuid: 'cf-drain',
      })),
    ];

    const result = firstValueFrom(service.fetchSpacesForOrg('cf-drain', 'org-B'));

    // Page 1: full (500 items), NO totalResults — per-org endpoint
    httpMock.expectOne('/pp/v1/cf/org/cf-drain/org-B/spaces?per_page=500&page=1')
      .flush({ resources: page1Spaces });

    // Page 2: short (10 items < 500), NO totalResults — stops here
    httpMock.expectOne('/pp/v1/cf/org/cf-drain/org-B/spaces?per_page=500&page=2')
      .flush({ resources: page2Spaces });

    const spaces = await result;
    // All 510 spaces are returned (server already filters by org)
    expect(spaces.length).toBe(510);
    // Results are sorted by name — Target Space sorts before Space P* alphabetically
    // (natural compare: 'Space P1 0' < 'Space P1 1' < ... 'Target Space')
    const targetIdx = spaces.findIndex(s => s.guid === 'space-target');
    expect(targetIdx).toBeGreaterThanOrEqual(0);

    httpMock.expectNone('/pp/v1/cf/org/cf-drain/org-B/spaces?per_page=500&page=3');
  });

  it('drainCfList (via fetchSpacesForOrg): totalResults absent — single short page, no extra fetch', async () => {
    // fetchSpacesForOrg uses the per-org endpoint; a short page must not trigger page 2.
    const service = TestBed.inject(CfRolesService);

    const result = firstValueFrom(service.fetchSpacesForOrg('cf-short', 'org-X'));

    // Only 60 items — short page, must NOT trigger page 2
    httpMock.expectOne('/pp/v1/cf/org/cf-short/org-X/spaces?per_page=500&page=1')
      .flush({ resources: Array.from({ length: 60 }, (_, i) => ({
        guid: `space-${i}`,
        name: `Space ${i}`,
        orgGuid: 'org-X',
        cnsiGuid: 'cf-short',
      })) });

    const spaces = await result;
    expect(spaces.length).toBe(60);

    httpMock.expectNone('/pp/v1/cf/org/cf-short/org-X/spaces?per_page=500&page=2');
  });

  it('drainCfList (via populateRoles): totalResults present — uses totalResults to compute pages, no short-page logic', async () => {
    const service = TestBed.inject(CfRolesService);
    const user = stUser({
      guid: 'user-1',
      orgRoles: [{ orgGuid: 'org-far', roles: ['manager'] }],
    });

    const result = firstValueFrom(service.populateRoles('cf-total', [user]).pipe(take(1)));

    // Orgs: totalResults=600 → 2 pages fetched (fast path)
    httpMock.expectOne('/pp/v1/cf/orgs/cf-total?per_page=500&page=1')
      .flush({ resources: [], totalResults: 600 });
    httpMock.expectOne('/pp/v1/cf/orgs/cf-total?per_page=500&page=2')
      .flush({ resources: [{ guid: 'org-far', name: 'Far Org', cnsiGuid: 'cf-total' }], totalResults: 600 });
    // Spaces: totalResults=0 → 1 page (fast path, single)
    httpMock.expectOne('/pp/v1/cf/spaces/cf-total?per_page=500&page=1')
      .flush({ resources: [], totalResults: 0 });

    const roles = await result;
    expect(roles['user-1']['org-far'].name).toBe('Far Org');
    expect(roles['user-1']['org-far'].permissions.managers).toBe(true);

    // No page 3 fetched for orgs (totalResults=600 → exactly 2 pages)
    httpMock.expectNone('/pp/v1/cf/orgs/cf-total?per_page=500&page=3');
  });

  // ── G: fetchSpacesForOrg — per-org endpoint, name sort, cache ──────────────

  it('G: fetchSpacesForOrg hits per-org endpoint, maps to {guid,name}, sorts by name', async () => {
    // fetchSpacesForOrg must use /pp/v1/cf/org/<cf>/<org>/spaces (NOT the global spaces endpoint),
    // map the response to {guid, name} pairs, and sort them by natural name order.
    const service = TestBed.inject(CfRolesService);

    const result = firstValueFrom(service.fetchSpacesForOrg('cf-1', 'org-1'));

    // Assert the correct per-org URL is hit (not /pp/v1/cf/spaces/cf-1)
    const req = httpMock.expectOne('/pp/v1/cf/org/cf-1/org-1/spaces?per_page=500&page=1');
    expect(req.request.method).toBe('GET');
    req.flush({
      resources: [
        { guid: 's1', name: 'Zebra Space', orgGuid: 'org-1', cnsiGuid: 'cf-1' },
        { guid: 's2', name: 'Alpha Space', orgGuid: 'org-1', cnsiGuid: 'cf-1' },
        { guid: 's3', name: 'Mango Space', orgGuid: 'org-1', cnsiGuid: 'cf-1' },
      ],
      totalResults: 3,
    });

    const spaces = await result;

    // Mapped to {guid, name} — no extra fields
    expect(spaces).toEqual([
      { guid: 's2', name: 'Alpha Space' },
      { guid: 's3', name: 'Mango Space' },
      { guid: 's1', name: 'Zebra Space' },
    ]);

    // Correct endpoint, NOT the global spaces path
    httpMock.expectNone('/pp/v1/cf/spaces/cf-1?per_page=500&page=1');
  });

  it('G: fetchSpacesForOrg caches — second subscription issues no new HTTP request', async () => {
    // shareReplay({ bufferSize: 1, refCount: false }) must replay the cached
    // result on re-subscription without issuing a new HTTP GET.
    const service = TestBed.inject(CfRolesService);

    // First subscription
    const first = firstValueFrom(service.fetchSpacesForOrg('cf-cache', 'org-cache'));
    httpMock.expectOne('/pp/v1/cf/org/cf-cache/org-cache/spaces?per_page=500&page=1')
      .flush({ resources: [{ guid: 's1', name: 'My Space', orgGuid: 'org-cache', cnsiGuid: 'cf-cache' }] });
    await first;

    // Second subscription — must NOT issue another HTTP request
    const second = firstValueFrom(service.fetchSpacesForOrg('cf-cache', 'org-cache'));
    httpMock.expectNone('/pp/v1/cf/org/cf-cache/org-cache/spaces?per_page=500&page=1');

    const spaces = await second;
    expect(spaces.length).toBe(1);
    expect(spaces[0].guid).toBe('s1');
  });
});
