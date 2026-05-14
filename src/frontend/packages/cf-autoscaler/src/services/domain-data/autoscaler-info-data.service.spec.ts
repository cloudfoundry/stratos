import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AutoscalerInfoDataService } from './autoscaler-info-data.service';

const ENDPOINT_GUID = 'cf-1';
const INFO_URL = '/pp/v1/autoscaler/info';

describe('AutoscalerInfoDataService', () => {
  let svc: AutoscalerInfoDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AutoscalerInfoDataService,
      ],
    });
    svc = TestBed.inject(AutoscalerInfoDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty signals before any load', () => {
    expect(svc.info(ENDPOINT_GUID)()).toBeNull();
    expect(svc.loading(ENDPOINT_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID)()).toBeNull();
    expect(svc.isAvailable(ENDPOINT_GUID)()).toBe(false);
  });

  it('load() fires the autoscaler info request with cnsi headers', async () => {
    const promise = svc.load(ENDPOINT_GUID);

    const req = httpMock.expectOne(INFO_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-passthrough')).toBe('true');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);

    req.flush({ name: 'as', build: '3.0.0', support: 'x', description: 'y' });
    await promise;

    const info = svc.info(ENDPOINT_GUID)();
    expect(info?.build).toBe('3.0.0');
    expect(svc.loading(ENDPOINT_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID)()).toBeNull();
    expect(svc.isAvailable(ENDPOINT_GUID)()).toBe(true);
  });

  it('load() captures 404 as unavailable, not as error', async () => {
    const promise = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(INFO_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await promise;

    expect(svc.info(ENDPOINT_GUID)()).toBeNull();
    expect(svc.isAvailable(ENDPOINT_GUID)()).toBe(false);
    // 404 is "not configured" — not surfaced as an error
    expect(svc.error(ENDPOINT_GUID)()).toBeNull();
  });

  it('load() captures non-404 errors on the error signal', async () => {
    const promise = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(INFO_URL).flush('boom', { status: 500, statusText: 'Internal Server Error' });
    await promise;

    expect(svc.error(ENDPOINT_GUID)()).not.toBeNull();
    expect(svc.isAvailable(ENDPOINT_GUID)()).toBe(false);
  });

  it('canManageCredentials returns true only when build major >= 3', async () => {
    const p1 = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(INFO_URL).flush({ name: 'as', build: '2.5.1', support: '', description: '' });
    await p1;
    expect(svc.canManageCredentials(ENDPOINT_GUID)()).toBe(false);

    const p2 = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(INFO_URL).flush({ name: 'as', build: '3.0.0', support: '', description: '' });
    await p2;
    expect(svc.canManageCredentials(ENDPOINT_GUID)()).toBe(true);
  });

  it('canManageCredentials handles missing or malformed build strings', async () => {
    const p1 = svc.load(ENDPOINT_GUID);
    httpMock.expectOne(INFO_URL).flush({ name: 'as', build: undefined as unknown as string, support: '', description: '' });
    await p1;
    expect(svc.canManageCredentials(ENDPOINT_GUID)()).toBe(false);
  });

  it('per-endpoint state is isolated', async () => {
    const p1 = svc.load('cf-a');
    httpMock.expectOne(INFO_URL).flush({ name: 'as', build: '3.0.0', support: '', description: '' });
    await p1;

    const p2 = svc.load('cf-b');
    httpMock.expectOne(INFO_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await p2;

    expect(svc.isAvailable('cf-a')()).toBe(true);
    expect(svc.isAvailable('cf-b')()).toBe(false);
  });
});
