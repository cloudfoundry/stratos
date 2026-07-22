import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AutoscalerHealthDataService } from './autoscaler-health-data.service';

const ENDPOINT_GUID = 'cf-1';
const HEALTH_URL = '/pp/v1/autoscaler/health';

describe('AutoscalerHealthDataService', () => {
  let svc: AutoscalerHealthDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AutoscalerHealthDataService,
      ],
    });
    svc = TestBed.inject(AutoscalerHealthDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty signals before any load', () => {
    expect(svc.health(ENDPOINT_GUID)()).toBeNull();
    expect(svc.loading(ENDPOINT_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID)()).toBeNull();
    expect(svc.isHealthy(ENDPOINT_GUID)()).toBe(false);
  });

  it('load() fires the autoscaler health request with cnsi headers', async () => {
    const promise = svc.load(ENDPOINT_GUID);

    const req = httpMock.expectOne(HEALTH_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-passthrough')).toBe('true');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);

    req.flush({ entity: { uptime: 1234 } });
    await promise;

    expect(svc.health(ENDPOINT_GUID)()?.entity.uptime).toBe(1234);
    expect(svc.isHealthy(ENDPOINT_GUID)()).toBe(true);
    expect(svc.error(ENDPOINT_GUID)()).toBeNull();
  });

  it('load() captures 404/503 as unhealthy without surfacing as error', async () => {
    const p1 = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(HEALTH_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await p1;
    expect(svc.isHealthy(ENDPOINT_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID)()).toBeNull();

    const p2 = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(HEALTH_URL).flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
    await p2;
    expect(svc.isHealthy(ENDPOINT_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID)()).toBeNull();
  });

  it('load() captures non-404/503 errors on the error signal', async () => {
    const promise = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(HEALTH_URL).flush('boom', { status: 500, statusText: 'Internal Server Error' });
    await promise;

    expect(svc.error(ENDPOINT_GUID)()).not.toBeNull();
    expect(svc.isHealthy(ENDPOINT_GUID)()).toBe(false);
  });

  it('per-endpoint state is isolated', async () => {
    const p1 = svc.load('cf-a');
    httpMock.expectOne(HEALTH_URL).flush({ entity: { uptime: 1 } });
    await p1;

    const p2 = svc.load('cf-b');
    httpMock.expectOne(HEALTH_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await p2;

    expect(svc.isHealthy('cf-a')()).toBe(true);
    expect(svc.isHealthy('cf-b')()).toBe(false);
  });
});
