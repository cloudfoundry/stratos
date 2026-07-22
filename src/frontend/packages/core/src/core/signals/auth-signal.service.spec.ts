import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthDataService } from '@stratosui/store';
import type { RouterRedirect, SessionData } from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';

/**
 * AuthSignalService is a thin facade over {@link AuthDataService}: it
 * re-exposes the data service's signals and delegates the mutation methods.
 * These tests stub AuthDataService and verify the wiring — the underlying
 * auth state machine is covered by auth-data.service.spec.ts.
 */
describe('AuthSignalService', () => {
  let loggedIn: ReturnType<typeof signal<boolean>>;
  let sessionData: ReturnType<typeof signal<SessionData | null>>;
  let loginCompletedAt: ReturnType<typeof signal<number>>;
  let login: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let verifySession: ReturnType<typeof vi.fn>;
  let navigateAndRememberRedirect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loggedIn = signal(false);
    sessionData = signal<SessionData | null>(null);
    loginCompletedAt = signal(0);
    login = vi.fn();
    logout = vi.fn();
    verifySession = vi.fn();
    navigateAndRememberRedirect = vi.fn();

    const stubAuthData = {
      auth: signal(undefined),
      loggedIn,
      loggingIn: signal(false),
      verifying: signal(false),
      error: signal(false),
      errorResponse: signal(undefined),
      sessionData,
      sessionValid: signal(false),
      redirect: signal<RouterRedirect | undefined>(undefined),
      loginCompletedAt,
      login,
      logout,
      verifySession,
      navigateAndRememberRedirect,
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthDataService, useValue: stubAuthData },
        AuthSignalService,
      ],
    });
  });

  it('re-exposes the data service signals', () => {
    const service = TestBed.inject(AuthSignalService);
    expect(service.loggedIn()).toBe(false);
    expect(service.sessionData()).toBeNull();
    expect(service.loginCompletedAt()).toBe(0);

    const data = { valid: true } as unknown as SessionData;
    loggedIn.set(true);
    sessionData.set(data);
    loginCompletedAt.set(123);

    expect(service.loggedIn()).toBe(true);
    expect(service.sessionData()).toBe(data);
    expect(service.loginCompletedAt()).toBe(123);
  });

  it('delegates login() to the data service', () => {
    TestBed.inject(AuthSignalService).login('alice', 's3cret');
    expect(login).toHaveBeenCalledWith('alice', 's3cret');
  });

  it('delegates logout() to the data service', () => {
    TestBed.inject(AuthSignalService).logout();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('delegates verifySession() with its flags', () => {
    TestBed.inject(AuthSignalService).verifySession(true, true);
    expect(verifySession).toHaveBeenCalledWith(true, true);
  });

  it('delegates navigateAndRememberRedirect()', () => {
    const redirect: RouterRedirect = { path: '/after' };
    TestBed.inject(AuthSignalService).navigateAndRememberRedirect(['/login'], redirect);
    expect(navigateAndRememberRedirect).toHaveBeenCalledWith(['/login'], redirect);
  });
});
