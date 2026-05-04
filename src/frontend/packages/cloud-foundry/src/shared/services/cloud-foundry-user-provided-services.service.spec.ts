import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
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
