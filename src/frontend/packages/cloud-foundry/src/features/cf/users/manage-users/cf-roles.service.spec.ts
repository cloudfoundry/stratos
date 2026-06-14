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
});
