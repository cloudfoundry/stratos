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

import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfRolesService } from './cf-roles.service';

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
    expect(second.entity.metadata.guid).toBe('org-1');
    expect(second.entity.entity.name).toBe('My Org');
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
});
