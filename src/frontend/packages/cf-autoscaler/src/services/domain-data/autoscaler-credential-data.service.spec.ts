import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AutoscalerCredentialDataService } from './autoscaler-credential-data.service';

const ENDPOINT_GUID = 'cf-1';
const APP_GUID = 'app-1';
const CRED_URL = `/pp/v1/autoscaler/apps/${APP_GUID}/credential`;

describe('AutoscalerCredentialDataService', () => {
  let svc: AutoscalerCredentialDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AutoscalerCredentialDataService,
      ],
    });
    svc = TestBed.inject(AutoscalerCredentialDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty signals before any operation', () => {
    expect(svc.credential(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('create() with no body fires PUT with cnsi headers (random credential)', async () => {
    const promise = svc.create(ENDPOINT_GUID, APP_GUID);

    const req = httpMock.expectOne(CRED_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-passthrough')).toBe('true');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);
    expect(req.request.body).toBeNull();

    req.flush({
      username: 'u', password: 'p', app_id: APP_GUID, url: 'https://as.example',
    });
    const result = await promise;

    expect(result.username).toBe('u');
    const cred = svc.credential(ENDPOINT_GUID, APP_GUID)();
    expect(cred?.username).toBe('u');
    expect(cred?.password).toBe('p');
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('create() with body sends supplied username/password', async () => {
    const promise = svc.create(ENDPOINT_GUID, APP_GUID, { username: 'me', password: 'pw' });

    const req = httpMock.expectOne(CRED_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ username: 'me', password: 'pw' });
    req.flush({ username: 'me', password: 'pw', app_id: APP_GUID, url: 'https://as.example' });
    await promise;

    expect(svc.credential(ENDPOINT_GUID, APP_GUID)()?.username).toBe('me');
  });

  it('create() captures error on the error signal and rejects', async () => {
    const promise = svc.create(ENDPOINT_GUID, APP_GUID);
    httpMock.expectOne(CRED_URL).flush('boom', { status: 500, statusText: 'Internal Server Error' });

    await expect(promise).rejects.toBeDefined();
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
  });

  it('delete() fires DELETE and clears the cached credential', async () => {
    // Seed a credential
    const cp = svc.create(ENDPOINT_GUID, APP_GUID);
    httpMock.expectOne(CRED_URL).flush({ username: 'u', password: 'p', app_id: APP_GUID, url: 'x' });
    await cp;
    expect(svc.credential(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();

    const dp = svc.delete(ENDPOINT_GUID, APP_GUID);
    const req = httpMock.expectOne(CRED_URL);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(ENDPOINT_GUID);
    req.flush(null);
    await dp;

    expect(svc.credential(ENDPOINT_GUID, APP_GUID)()).toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).toBeNull();
  });

  it('delete() captures error on the error signal and rejects', async () => {
    const dp = svc.delete(ENDPOINT_GUID, APP_GUID);
    httpMock.expectOne(CRED_URL).flush('boom', { status: 500, statusText: 'Internal Server Error' });

    await expect(dp).rejects.toBeDefined();
    expect(svc.error(ENDPOINT_GUID, APP_GUID)()).not.toBeNull();
    expect(svc.loading(ENDPOINT_GUID, APP_GUID)()).toBe(false);
  });

  it('per-(endpoint,app) state is isolated', async () => {
    const p1 = svc.create('cf-a', 'app-x');
    httpMock.expectOne('/pp/v1/autoscaler/apps/app-x/credential')
      .flush({ username: 'ua', password: 'pa', app_id: 'app-x', url: 'x' });
    await p1;

    const p2 = svc.create('cf-b', 'app-y');
    httpMock.expectOne('/pp/v1/autoscaler/apps/app-y/credential')
      .flush({ username: 'ub', password: 'pb', app_id: 'app-y', url: 'y' });
    await p2;

    expect(svc.credential('cf-a', 'app-x')()?.username).toBe('ua');
    expect(svc.credential('cf-b', 'app-y')()?.username).toBe('ub');
    expect(svc.credential('cf-a', 'app-y')()).toBeNull();
  });
});
