import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { SystemInfo } from '../types/system.types';
import { EndpointsDataService } from './endpoints-data.service';

const SYSTEM_INFO_URL = '/pp/v1/info';

function makeSystemInfo(): SystemInfo {
  return {
    version: { proxy_version: 'test', database_version: 1 },
    user: { guid: 'u1', name: 'admin', admin: true },
    endpoints: {
      cf: {
        'cf-1': {
          guid: 'cf-1',
          name: 'cf-one',
          cnsi_type: 'cf',
          user: { guid: 'u1', name: 'admin', admin: true },
          system_shared_token: false,
          sso_allowed: false,
          metricsAvailable: false,
          creator: { name: 'admin', admin: true, system: false },
        } as unknown as SystemInfo['endpoints']['cf']['cf-1'],
        'cf-2': {
          guid: 'cf-2',
          name: 'cf-two',
          cnsi_type: 'cf',
          // No user => disconnected
          system_shared_token: false,
          sso_allowed: false,
          metricsAvailable: false,
          creator: { name: 'admin', admin: true, system: false },
        } as unknown as SystemInfo['endpoints']['cf']['cf-2'],
      },
      k8s: {
        'k8s-1': {
          guid: 'k8s-1',
          name: 'k8s-one',
          cnsi_type: 'k8s',
          user: { guid: 'u1', name: 'admin', admin: true },
          system_shared_token: false,
          sso_allowed: false,
          metricsAvailable: false,
          creator: { name: 'admin', admin: true, system: false },
        } as unknown as SystemInfo['endpoints']['k8s']['k8s-1'],
      },
    },
  };
}

describe('EndpointsDataService', () => {
  let svc: EndpointsDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        EndpointsDataService,
      ],
    });
    svc = TestBed.inject(EndpointsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes empty signal surface before hydration', () => {
    expect(svc.endpoints().size).toBe(0);
    expect(svc.endpointsList().length).toBe(0);
    expect(svc.connected()().length).toBe(0);
    expect(svc.endpointById('cf-1')()).toBeNull();
    expect(svc.loading()).toBe(false);
    expect(svc.error()).toBeNull();
  });

  it('getAll() loads endpoints and derives connectionStatus from user', async () => {
    const promise = svc.getAll();
    const req = httpMock.expectOne(SYSTEM_INFO_URL);
    expect(req.request.method).toBe('GET');
    req.flush(makeSystemInfo());
    const list = await promise;

    expect(list).toHaveLength(3);
    expect(svc.endpoints().size).toBe(3);
    expect(svc.endpointById('cf-1')()?.connectionStatus).toBe('connected');
    expect(svc.endpointById('cf-2')()?.connectionStatus).toBe('disconnected');
    expect(svc.loading()).toBe(false);
  });

  it('endpointsByType filters by cnsi_type', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;

    expect(svc.endpointsByType('cf')().map(e => e.guid).sort()).toEqual(['cf-1', 'cf-2']);
    expect(svc.endpointsByType('k8s')().map(e => e.guid)).toEqual(['k8s-1']);
  });

  it('connected(type) returns only connected endpoints of the given type', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;

    expect(svc.connected()().map(e => e.guid).sort()).toEqual(['cf-1', 'k8s-1']);
    expect(svc.connected('cf')().map(e => e.guid)).toEqual(['cf-1']);
    expect(svc.connected('k8s')().map(e => e.guid)).toEqual(['k8s-1']);
  });

  it('whenReady resolves once getAll completes', async () => {
    const ready = svc.whenReady();
    const req = httpMock.expectOne(SYSTEM_INFO_URL);
    req.flush(makeSystemInfo());
    await ready;
    expect(svc.endpoints().size).toBe(3);
  });

  it('whenReady is no-op once hydrated', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;
    await svc.whenReady(); // should not fire another request
  });

  it('getAll() failure populates error and still marks hydrated', async () => {
    const p = svc.getAll().catch(() => undefined);
    httpMock.expectOne(SYSTEM_INFO_URL).flush('boom', { status: 500, statusText: 'err' });
    await p;
    expect(svc.error()).not.toBeNull();
    await svc.whenReady(); // hydrated even on failure
  });

  it('disconnect() emits a delta event and marks the endpoint disconnected', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;

    const disconnectPromise = svc.disconnect('cf-1');
    httpMock.expectOne('/api/v1/tokens/cf-1').flush({ guid: 'cf-1' });
    const state = await disconnectPromise;

    expect(state.error).toBe(false);
    expect(svc.endpointById('cf-1')()?.connectionStatus).toBe('disconnected');
    const events = svc.disconnectedSignal();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ guid: 'cf-1', type: 'cf', name: 'cf-one' });
  });

  it('unregister() removes endpoint and emits delta event', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;

    const unregisterPromise = svc.unregister('k8s-1');
    httpMock.expectOne('/api/v1/endpoints/k8s-1').flush({ guid: 'k8s-1' });
    const state = await unregisterPromise;

    expect(state.error).toBe(false);
    expect(svc.endpointById('k8s-1')()).toBeNull();
    expect(svc.disconnectedSignal()).toHaveLength(1);
  });

  it('clearDisconnected resets the delta queue', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;

    const dp = svc.disconnect('cf-1');
    httpMock.expectOne('/api/v1/tokens/cf-1').flush({ guid: 'cf-1' });
    await dp;
    expect(svc.disconnectedSignal()).toHaveLength(1);

    svc.clearDisconnected();
    expect(svc.disconnectedSignal()).toHaveLength(0);
  });

  it('connectingState reflects connect lifecycle', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;

    const connectPromise = svc.connect('cf-2', {
      endpointType: 'cf',
      authType: 'creds',
      authValues: { username: 'u', password: 'p' },
      systemShared: false,
    });
    expect(svc.connectingState('cf-2')().busy).toBe(true);

    httpMock.expectOne('/api/v1/tokens').flush({ guid: 'cf-2' });
    // Yield enough microtasks so the .then() handler runs and dispatches
    // the awaited getAll() HTTP request.
    await new Promise(r => setTimeout(r, 0));
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    const state = await connectPromise;

    expect(state.error).toBe(false);
    expect(svc.connectingState('cf-2')().busy).toBe(false);

    // Successful connect emits on the connectedSignal delta queue.
    expect(svc.connectedSignal()).toHaveLength(1);
    expect(svc.connectedSignal()[0]).toMatchObject({ guid: 'cf-2', type: 'cf' });
  });

  it('clearConnected resets the connect delta queue', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;

    const cp = svc.connect('cf-2', {
      endpointType: 'cf',
      authType: 'creds',
      authValues: { username: 'u', password: 'p' },
      systemShared: false,
    });
    httpMock.expectOne('/api/v1/tokens').flush({ guid: 'cf-2' });
    await new Promise(r => setTimeout(r, 0));
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await cp;

    expect(svc.connectedSignal()).toHaveLength(1);
    svc.clearConnected();
    expect(svc.connectedSignal()).toHaveLength(0);
  });

  it('wasLoginCall records the login flag from the most recent getAll', async () => {
    const p = svc.getAll(true);
    httpMock.expectOne(SYSTEM_INFO_URL).flush(makeSystemInfo());
    await p;
    expect(svc.wasLoginCall()).toBe(true);
  });
});
