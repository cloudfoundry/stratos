import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StratosBrandingService } from '@stratosui/theme';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardDataService } from '../../../core/src/core/dashboard-data.service';
import { RouterRedirect } from '../types/auth.types';
import { CurrentUserRolesDataService } from './current-user-roles-data.service';
import { EndpointsDataService } from './endpoints-data.service';
import { AuthDataService } from './auth-data.service';

const VERIFY_URL = '/api/v1/auth/verify';
const LOGIN_URL = '/pp/v1/auth/login/uaa';
const LOGOUT_URL = '/pp/v1/auth/logout';

function okEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    status: 'ok',
    data: { valid: true, config: {}, plugins: { demo: false }, ...overrides },
  };
}

describe('AuthDataService', () => {
  let httpMock: HttpTestingController;
  let applySessionScopes: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let activateUserPreferences: ReturnType<typeof vi.fn>;
  let getAll: ReturnType<typeof vi.fn>;
  let assignSpy: ReturnType<typeof vi.spyOn>;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    applySessionScopes = vi.fn();
    navigate = vi.fn();
    activateUserPreferences = vi.fn();
    getAll = vi.fn().mockResolvedValue([]);
    assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CurrentUserRolesDataService, useValue: { applySessionScopes } },
        { provide: Router, useValue: { navigate } },
        { provide: StratosBrandingService, useValue: { activateUserPreferences } },
        { provide: DashboardDataService, useValue: { hydrateFromStorage: vi.fn() } },
        { provide: EndpointsDataService, useValue: { getAll } },
        AuthDataService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    assignSpy.mockRestore();
    openSpy.mockRestore();
  });

  it('starts in the default verifying state', () => {
    const svc = TestBed.inject(AuthDataService);
    expect(svc.loggedIn()).toBe(false);
    expect(svc.verifying()).toBe(true);
    expect(svc.sessionData()).toBeNull();
    expect(svc.loginCompletedAt()).toBe(0);
  });

  it('verifySession success marks the session verified and feeds the roles slice', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.verifySession(true, true);

    const req = httpMock.expectOne(VERIFY_URL);
    expect(req.request.method).toBe('GET');
    req.flush(okEnvelope(), { headers: { 'x-cap-session-expires-on': '5' } });
    await p;

    expect(svc.verifying()).toBe(false);
    expect(svc.loggedIn()).toBe(true);
    expect(svc.sessionValid()).toBe(true);
    expect(svc.loginCompletedAt()).toBeGreaterThan(0);
    expect(activateUserPreferences).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith(true);
    // Applies the verified session user's internal scopes to the signal-native
    // roles source of truth (replaces the deleted CURRENT_USER_ROLES_SESSION_VERIFIED
    // dispatch).
    expect(applySessionScopes).toHaveBeenCalled();
  });

  it('verifySession without login does not mark logged-in', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.verifySession(false, false);
    httpMock.expectOne(VERIFY_URL).flush(okEnvelope(), { headers: { 'x-cap-session-expires-on': '5' } });
    await p;
    expect(svc.sessionValid()).toBe(true);
    expect(svc.loggedIn()).toBe(false);
    expect(svc.loginCompletedAt()).toBe(0);
  });

  it('verifySession error envelope during login records an invalid, errored session', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.verifySession(true, true);
    httpMock.expectOne(VERIFY_URL).flush({ status: 'error', error: 'nope' });
    await p;
    expect(svc.verifying()).toBe(false);
    expect(svc.loggedIn()).toBe(false);
    expect(svc.sessionValid()).toBe(false);
    expect(svc.error()).toBe(true);
    expect(svc.errorResponse()).toBe('Invalid session');
  });

  it('verifySession HTTP failure without login resets to the default state', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.verifySession(false, false);
    httpMock.expectOne(VERIFY_URL).flush('fail', { status: 401, statusText: 'Unauthorized' });
    await p;
    expect(svc.loggedIn()).toBe(false);
    expect(svc.error()).toBe(false);
    expect(svc.sessionData()).toBeNull();
  });

  it('login posts the credentials then runs a verify cycle', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.login('alice', 's3cret');

    const loginReq = httpMock.expectOne(LOGIN_URL);
    expect(loginReq.request.method).toBe('POST');
    expect(loginReq.request.body.toString()).toContain('username=alice');
    expect(svc.loggingIn()).toBe(true);
    loginReq.flush({});

    // The verify GET follows once the login POST resolves.
    await Promise.resolve();
    httpMock.expectOne(VERIFY_URL).flush(okEnvelope(), { headers: { 'x-cap-session-expires-on': '5' } });
    await p;

    expect(svc.loggedIn()).toBe(true);
  });

  it('login failure records the error and stops logging in', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.login('alice', 'bad');
    httpMock.expectOne(LOGIN_URL).flush('denied', { status: 401, statusText: 'Unauthorized' });
    await p;
    expect(svc.loggingIn()).toBe(false);
    expect(svc.loggedIn()).toBe(false);
    expect(svc.error()).toBe(true);
  });

  it('logout posts and resets the location for a non-SSO session', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.logout();
    const req = httpMock.expectOne(LOGOUT_URL);
    expect(req.request.method).toBe('POST');
    req.flush({ isSSO: false });
    await p;
    expect(assignSpy).toHaveBeenCalledWith(window.location.origin);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('logout hands off to the SSO logout endpoint for an SSO session', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.logout();
    httpMock.expectOne(LOGOUT_URL).flush({ isSSO: true });
    await p;
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toContain('/pp/v1/auth/sso_logout');
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('logout failure keeps the user logged in and flags an error', async () => {
    const svc = TestBed.inject(AuthDataService);
    const p = svc.logout();
    httpMock.expectOne(LOGOUT_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await p;
    expect(svc.loggedIn()).toBe(true);
    expect(svc.error()).toBe(true);
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('navigateAndRememberRedirect stores the redirect signal and navigates', () => {
    const svc = TestBed.inject(AuthDataService);
    const redirect: RouterRedirect = { path: '/after' };
    svc.navigateAndRememberRedirect(['/login'], redirect);
    expect(svc.redirect()).toEqual(redirect);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('splits a string path into segments when navigating', () => {
    const svc = TestBed.inject(AuthDataService);
    svc.navigateAndRememberRedirect('/login', { path: '/after' });
    expect(navigate).toHaveBeenCalledWith(['', 'login']);
  });
});
