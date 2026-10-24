import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SystemInfo } from '../types/system.types';
import { AuthDataService } from './auth-data.service';
import { describeLastConnectError, EndpointLastErrorService } from './endpoint-last-error.service';
import { EndpointsDataService } from './endpoints-data.service';

const ENDPOINT = {
  guid: 'cf-1', name: 'cf', cnsi_type: 'cf', system_shared_token: false, sso_allowed: false,
  creator: { name: 'admin', admin: true, system: false },
};
const INFO = { endpoints: { cf: { 'cf-1': ENDPOINT } } } as unknown as SystemInfo;

// The last failed connect of an endpoint, kept per user in browser storage
// so the endpoints page can still say what went wrong after a reload.
describe('EndpointLastErrorService', () => {
  let httpMock: HttpTestingController;
  const userGuid = signal('user-1');

  // A fresh injector reads storage again, as a page reload does.
  const reload = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthDataService, useValue: { sessionData: () => ({ user: { guid: userGuid() } }) } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return { data: TestBed.inject(EndpointsDataService), lastError: TestBed.inject(EndpointLastErrorService) };
  };

  const connect = async (data: EndpointsDataService, ok: boolean) => {
    const p = data.getAll();
    httpMock.expectOne('/pp/v1/info').flush(INFO);
    await p;
    const done = data.connect('cf-1', { endpointType: 'cf', authType: 'creds', authValues: {}, systemShared: false });
    const req = httpMock.expectOne('/api/v1/tokens');
    if (ok) {
      req.flush({ guid: 'cf-1' });
      await new Promise(r => setTimeout(r, 0));
      httpMock.expectOne('/pp/v1/info').flush(INFO);
    } else {
      req.flush({ status: 'error', error: 'Could not connect to the endpoint' }, { status: 400, statusText: 'Bad Request' });
    }
    return done;
  };

  beforeEach(() => {
    localStorage.clear();
    userGuid.set('user-1');
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('keeps a failed connect\'s reason across a reload', async () => {
    const first = reload();
    const state = await connect(first.data, false);
    expect(first.lastError.lastError('cf-1')).toBe(state.message);

    expect(reload().lastError.lastError('cf-1')).toBe(state.message);
  });

  it('forgets it when a connect succeeds', async () => {
    const { data, lastError } = reload();
    await connect(data, false);
    await connect(data, true);
    expect(lastError.lastError('cf-1')).toBeNull();
    expect(reload().lastError.lastError('cf-1')).toBeNull();
  });

  it('keeps it per user', async () => {
    await connect(reload().data, false);
    userGuid.set('user-2');
    expect(reload().lastError.lastError('cf-1')).toBeNull();
  });

  it('still keeps it for the session when browser storage refuses it', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const { data, lastError } = reload();
    const state = await connect(data, false);
    expect(lastError.lastError('cf-1')).toBe(state.message);
  });

  it('words it as the last error', () => {
    expect(describeLastConnectError('Could not connect to the endpoint (400)'))
      .toBe('The last error was Could not connect to the endpoint (400). Reconnect to get the latest status.');
  });

  // The message is the endpoint's answer. A run of '.' not at the end made
  // a /\.+$/ trim backtrack quadratically.
  it('drops trailing dots in linear time', () => {
    expect(describeLastConnectError('Bad credentials...'))
      .toBe('The last error was Bad credentials. Reconnect to get the latest status.');
    const start = performance.now();
    expect(describeLastConnectError('.'.repeat(100_000) + 'x'))
      .toBe(`The last error was ${'.'.repeat(100_000)}x. Reconnect to get the latest status.`);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
