import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { CfInfoDataRegistry } from '../../../services/endpoint-data/cf-info-data.registry';
import { CnsiUsersSnapshotService } from '../../../services/endpoint-data/cnsi-users-snapshot.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { EndpointsDataService } from '@stratosui/store';

// A.#1: pins the URL shape of the instance fetchAppCount / fetchRouteCount
// helpers that replaced the V2 ngrx-pagination statics. The native handlers'
// ?return=counts branches now honor organization_guids + space_guids; these
// specs guarantee the frontend wires the right filter name for each shape.
describe('CloudFoundryEndpointService — fetchAppCount / fetchRouteCount', () => {
  let svc: CloudFoundryEndpointService;
  let http: HttpTestingController;

  beforeEach(() => {
    // Stub out the heavy deps — load() / waitFor() etc. would fire real
    // HTTP that the count specs don't care about. acquire() is also called
    // in the constructor so it has to return SOMETHING with the right shape.
    const endpointDataStub = {
      apps: () => [],
      orgs: () => [],
      appCount: () => 0,
      isLoadingDetails: () => false,
      loadDetails: () => ({ subscribe: vi.fn() }),
    };
    const cfInfoStub = {
      info: () => null,
      load: () => ({ subscribe: vi.fn() }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: 'cnsi-1' } },
        { provide: CnsiUsersSnapshotService, useValue: { users: () => () => null } },
        {
          provide: EndpointDataRegistry,
          useValue: { acquire: () => endpointDataStub, release: vi.fn() },
        },
        { provide: CfInfoDataRegistry, useValue: { acquire: () => cfInfoStub } },
        { provide: EndpointsDataService, useValue: { waitFor: () => new Promise(() => { /* never resolves */ }) } },
        CloudFoundryEndpointService,
      ],
    });
    svc = TestBed.inject(CloudFoundryEndpointService);
    http = TestBed.inject(HttpTestingController);
  });

  it('fetchAppCount() with no filter hits the cnsi-wide counts URL', () => {
    let count: number | undefined;
    svc.fetchAppCount().subscribe(n => (count = n));
    const req = http.expectOne('/pp/v1/cf/apps/cnsi-1?return=counts');
    expect(req.request.method).toBe('GET');
    req.flush({ totalResults: 42 });
    expect(count).toBe(42);
  });

  it('fetchAppCount(orgGuid) forwards organization_guids filter', () => {
    svc.fetchAppCount('org-A').subscribe();
    http.expectOne('/pp/v1/cf/apps/cnsi-1?return=counts&organization_guids=org-A').flush({ totalResults: 7 });
  });

  it('fetchAppCount(orgGuid, spaceGuid) forwards both filters', () => {
    svc.fetchAppCount('org-A', 'space-X').subscribe();
    http.expectOne('/pp/v1/cf/apps/cnsi-1?return=counts&organization_guids=org-A&space_guids=space-X').flush({ totalResults: 2 });
  });

  it('fetchRouteCount(orgGuid) forwards organization_guids filter', () => {
    let count: number | undefined;
    svc.fetchRouteCount('org-A').subscribe(n => (count = n));
    http.expectOne('/pp/v1/cf/routes/cnsi-1?return=counts&organization_guids=org-A').flush({ totalResults: 9 });
    expect(count).toBe(9);
  });

  it('fetchAppCount() returns 0 when the handler errors so a count cell never shows red', () => {
    let count: number | undefined;
    svc.fetchAppCount().subscribe(n => (count = n));
    http.expectOne('/pp/v1/cf/apps/cnsi-1?return=counts').error(new ProgressEvent('Network error'));
    expect(count).toBe(0);
  });

  it('missing totalResults in response degrades to 0', () => {
    let count: number | undefined;
    svc.fetchAppCount().subscribe(n => (count = n));
    http.expectOne('/pp/v1/cf/apps/cnsi-1?return=counts').flush({});
    expect(count).toBe(0);
  });
});

// A.#2: guard for construction outside a CF route subtree (e.g. CDK overlay
// injector for the Add User dialog). When cfGuid is falsy the service must
// construct without issuing any HTTP requests — no acquire(), no load().
describe('CloudFoundryEndpointService — no-op when cfGuid is falsy', () => {
  function buildWithGuid(cfGuid: string | undefined) {
    const acquireFn = vi.fn().mockReturnValue({
      apps: () => [],
      orgs: () => [],
      appCount: () => 0,
      isLoadingDetails: () => false,
      load: () => ({ subscribe: vi.fn() }),
    });
    const cfInfoAcquireFn = vi.fn().mockReturnValue({
      info: () => null,
      load: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid } },
        { provide: CnsiUsersSnapshotService, useValue: { users: () => () => null } },
        { provide: EndpointDataRegistry, useValue: { acquire: acquireFn, release: vi.fn() } },
        { provide: CfInfoDataRegistry, useValue: { acquire: cfInfoAcquireFn } },
        { provide: EndpointsDataService, useValue: { waitFor: () => new Promise(() => { /* never resolves */ }) } },
        CloudFoundryEndpointService,
      ],
    });
    const svc = TestBed.inject(CloudFoundryEndpointService);
    const http = TestBed.inject(HttpTestingController);
    return { svc, http, acquireFn, cfInfoAcquireFn };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('does not call EndpointDataRegistry.acquire when cfGuid is undefined', () => {
    const { acquireFn, http } = buildWithGuid(undefined);
    http.expectNone(() => true);
    expect(acquireFn).not.toHaveBeenCalled();
  });

  it('does not call CfInfoDataRegistry.acquire when cfGuid is undefined', () => {
    const { cfInfoAcquireFn } = buildWithGuid(undefined);
    expect(cfInfoAcquireFn).not.toHaveBeenCalled();
  });

  it('does not call EndpointDataRegistry.acquire when cfGuid is empty string', () => {
    const { acquireFn, http } = buildWithGuid('');
    http.expectNone(() => true);
    expect(acquireFn).not.toHaveBeenCalled();
  });

  it('observable fields are inert EMPTY streams when cfGuid is undefined', () => {
    const { svc } = buildWithGuid(undefined);
    let emitted = false;
    svc.apps$.subscribe(() => { emitted = true; });
    svc.orgs$.subscribe(() => { emitted = true; });
    svc.endpoint$.subscribe(() => { emitted = true; });
    expect(emitted).toBe(false);
  });

  it('still calls acquire/load when cfGuid IS present (regression guard)', () => {
    const { acquireFn, cfInfoAcquireFn } = buildWithGuid('cnsi-1');
    expect(acquireFn).toHaveBeenCalledWith('cnsi-1');
    expect(cfInfoAcquireFn).toHaveBeenCalledWith('cnsi-1');
  });
});
