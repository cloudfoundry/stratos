import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { CloudFoundryUserProvidedServicesService } from './cloud-foundry-user-provided-services.service';
import { PaginationMonitorFactory } from '@stratosui/store';

// Tests targeting the V3-native rewrite of the create/update paths —
// asserts the wire shape against /pp/v1/cf/user_provided_service_instances/{cfGuid}
// rather than the legacy V2 NGRX action that hit /v2/user_provided_service_instances.

describe('CloudFoundryUserProvidedServicesService — V3 write surface', () => {
  let service: CloudFoundryUserProvidedServicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({ initialState: {} }),
        { provide: PaginationMonitorFactory, useValue: {} },
        CloudFoundryUserProvidedServicesService,
      ],
    });
    service = TestBed.inject(CloudFoundryUserProvidedServicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createUserProvidedService POSTs the V3 native shape', async () => {
    const data = {
      spaceGuid: 'space-1',
      name: 'my-ups',
      tags: ['red'],
      credentials: { username: 'u' },
      syslog_drain_url: 'https://syslog.example',
      route_service_url: 'https://route.example',
    };

    const result = service.createUserProvidedService('cnsi-1', 'guid-ignored', data);
    const promise = new Promise<any>((resolve) => result.subscribe(resolve));

    const req = httpMock.expectOne('/pp/v1/cf/user_provided_service_instances/cnsi-1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'my-ups',
      spaceGuid: 'space-1',
      tags: ['red'],
      credentials: { username: 'u' },
      syslogDrainUrl: 'https://syslog.example',
      routeServiceUrl: 'https://route.example',
    });
    req.flush({ guid: 'ups-1', name: 'my-ups', type: 'user-provided' });

    const res = await promise;
    expect(res).toEqual({ success: true, guid: 'ups-1' });
  });

  it('createUserProvidedService surfaces error message on failure', async () => {
    const result = service.createUserProvidedService('cnsi-1', 'g', { spaceGuid: 's', name: 'x' } as any);
    const promise = new Promise<any>((resolve) => result.subscribe(resolve));

    const req = httpMock.expectOne('/pp/v1/cf/user_provided_service_instances/cnsi-1');
    req.flush({ message: 'boom' }, { status: 422, statusText: 'Unprocessable' });

    const res = await promise;
    expect(res.success).toBe(false);
    expect(res.message).toContain('boom');
  });

  it('updateUserProvidedService PATCHes the V3 native shape', async () => {
    const data = {
      name: 'renamed-ups',
      tags: ['blue'],
      syslog_drain_url: 'https://syslog2.example',
    };

    const result = service.updateUserProvidedService('cnsi-1', 'ups-1', data);
    const promise = new Promise<any>((resolve) => result.subscribe(resolve));

    const req = httpMock.expectOne('/pp/v1/cf/user_provided_service_instances/cnsi-1/ups-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      name: 'renamed-ups',
      tags: ['blue'],
      syslogDrainUrl: 'https://syslog2.example',
    });
    req.flush({ guid: 'ups-1', name: 'renamed-ups' });

    const res = await promise;
    expect(res).toEqual({ success: true });
  });

  it('updateUserProvidedService surfaces error message on failure', async () => {
    const result = service.updateUserProvidedService('cnsi-1', 'ups-1', { name: 'x' });
    const promise = new Promise<any>((resolve) => result.subscribe(resolve));

    const req = httpMock.expectOne('/pp/v1/cf/user_provided_service_instances/cnsi-1/ups-1');
    req.flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });

    const res = await promise;
    expect(res.success).toBe(false);
    expect(res.message).toContain('nope');
  });
});

// Stage 9e — V3 read surface. The three read methods now hit the Stratos-shape
// /pp/v1/cf/.../service_instances handlers with a `?type=user-provided` filter
// pushed down to CF v3 by Jetstream, replacing the prior ngrx-paginated
// userProvidedService getMultiple/getEntityService dispatches.
describe('CloudFoundryUserProvidedServicesService — V3 read surface', () => {
  let service: CloudFoundryUserProvidedServicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({ initialState: {} }),
        { provide: PaginationMonitorFactory, useValue: {} },
        CloudFoundryUserProvidedServicesService,
      ],
    });
    service = TestBed.inject(CloudFoundryUserProvidedServicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getUserProvidedServices(cfGuid, spaceGuid) hits the space-scoped path with type+summary filters', async () => {
    const promise = firstValueFrom(service.getUserProvidedServices('cnsi-1', 'space-7'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/spaces/cnsi-1/space-7/service_instances'
      && r.params.get('return') === 'summary'
      && r.params.get('type') === 'user-provided'
      && r.params.get('per_page') === '5000'
    );
    req.flush({
      resources: [
        { guid: 'ups-1', name: 'first', type: 'user-provided' },
        { guid: 'ups-2', name: 'second', type: 'user-provided' },
      ],
      pagination: { totalResults: 2 },
    });

    const rows = await promise;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ guid: 'ups-1', name: 'first', cnsiGuid: 'cnsi-1' });
    expect(rows[1]).toMatchObject({ guid: 'ups-2', name: 'second', cnsiGuid: 'cnsi-1' });
  });

  it('getUserProvidedServices(cfGuid) without spaceGuid falls back to cnsi-wide path', async () => {
    const promise = firstValueFrom(service.getUserProvidedServices('cnsi-1'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/service_instances/cnsi-1'
      && r.params.get('type') === 'user-provided'
    );
    req.flush({ resources: [], pagination: { totalResults: 0 } });

    const rows = await promise;
    expect(rows).toEqual([]);
  });

  it('getUserProvidedService GETs the single-resource path with summary tier', async () => {
    const promise = firstValueFrom(service.getUserProvidedService('cnsi-1', 'ups-1'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/service_instances/cnsi-1/ups-1'
      && r.params.get('return') === 'summary'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      guid: 'ups-1',
      name: 'my-ups',
      type: 'user-provided',
      tags: ['red'],
      syslogDrainUrl: 'https://syslog.example',
      routeServiceUrl: 'https://route.example',
    });

    const si = await promise;
    expect(si.guid).toBe('ups-1');
    expect(si.cnsiGuid).toBe('cnsi-1');
    expect(si.tags).toEqual(['red']);
    expect(si.syslogDrainUrl).toBe('https://syslog.example');
  });

  it('fetchUserProvidedServiceInstancesCount(cfGuid) hits cnsi-wide counts with type filter', async () => {
    const promise = firstValueFrom(service.fetchUserProvidedServiceInstancesCount('cnsi-1'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/service_instances/cnsi-1'
      && r.params.get('return') === 'counts'
      && r.params.get('type') === 'user-provided'
    );
    req.flush({ resources: [], totalResults: 12 });

    expect(await promise).toBe(12);
  });

  it('fetchUserProvidedServiceInstancesCount(cfGuid, orgGuid) layers organization_guids', async () => {
    const promise = firstValueFrom(service.fetchUserProvidedServiceInstancesCount('cnsi-1', 'org-7'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/service_instances/cnsi-1'
      && r.params.get('organization_guids') === 'org-7'
      && r.params.get('type') === 'user-provided'
    );
    req.flush({ resources: [], totalResults: 4 });

    expect(await promise).toBe(4);
  });

  it('fetchUserProvidedServiceInstancesCount(cfGuid, undefined, spaceGuid) uses space-scoped path', async () => {
    const promise = firstValueFrom(service.fetchUserProvidedServiceInstancesCount('cnsi-1', undefined, 'space-7'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/spaces/cnsi-1/space-7/service_instances'
      && r.params.get('return') === 'counts'
      && r.params.get('type') === 'user-provided'
    );
    req.flush({ resources: [], totalResults: 2 });

    expect(await promise).toBe(2);
  });

  it('fetchUserProvidedServiceInstancesCount(cfGuid, orgGuid, spaceGuid) layers both filters on cnsi-wide path', async () => {
    const promise = firstValueFrom(service.fetchUserProvidedServiceInstancesCount('cnsi-1', 'org-7', 'space-7'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/service_instances/cnsi-1'
      && r.params.get('organization_guids') === 'org-7'
      && r.params.get('space_guids') === 'space-7'
      && r.params.get('type') === 'user-provided'
    );
    req.flush({ resources: [], totalResults: 1 });

    expect(await promise).toBe(1);
  });

  it('fetchUserProvidedServiceInstancesCount soft-fails to 0 on HTTP error', async () => {
    const promise = firstValueFrom(service.fetchUserProvidedServiceInstancesCount('cnsi-1'));

    const req = httpMock.expectOne(r =>
      r.url === '/pp/v1/cf/service_instances/cnsi-1'
      && r.params.get('return') === 'counts'
    );
    req.flush({ message: 'down' }, { status: 502, statusText: 'Bad Gateway' });

    expect(await promise).toBe(0);
  });
});
