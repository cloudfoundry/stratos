import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthDataService } from '@stratosui/store';
import type { SessionData } from '@stratosui/store';

import { SessionService } from './session.service';

describe('SessionService', () => {
  let sessionData: ReturnType<typeof signal<SessionData | null>>;

  beforeEach(() => {
    sessionData = signal<SessionData | null>(null);

    // SessionService -> AuthSignalService -> AuthDataService; stub the data
    // service so we drive sessionData directly.
    const stubAuthData = {
      auth: signal(undefined),
      loggedIn: signal(false),
      loggingIn: signal(false),
      verifying: signal(false),
      error: signal(false),
      errorResponse: signal(undefined),
      sessionData,
      sessionValid: signal(false),
      redirect: signal(undefined),
      loginCompletedAt: signal(0),
      login: () => undefined,
      logout: () => undefined,
      verifySession: () => undefined,
      navigateAndRememberRedirect: () => undefined,
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthDataService, useValue: stubAuthData },
        SessionService,
      ],
    });
  });

  it('exposes null sessionData when there is no auth payload', () => {
    const service = TestBed.inject(SessionService);
    expect(service.sessionData()).toBeNull();
    expect(service.config()).toBeNull();
  });

  it('exposes sessionData and config once the auth state populates', () => {
    const data = {
      valid: true,
      sessionExpiresOn: 0,
      plugins: { demo: false },
      config: { homeViewShowFavoritesOnly: true, listMaxSize: 100 },
    } as unknown as SessionData;

    sessionData.set(data);

    const service = TestBed.inject(SessionService);
    expect(service.sessionData()).toBe(data);
    expect(service.config()).toEqual({ homeViewShowFavoritesOnly: true, listMaxSize: 100 });
  });

  it('updates the signals when the auth state changes', () => {
    const service = TestBed.inject(SessionService);
    expect(service.config()).toBeNull();

    sessionData.set({
      valid: true,
      sessionExpiresOn: 0,
      plugins: { demo: false },
      config: { homeViewShowFavoritesOnly: false },
    } as unknown as SessionData);

    expect(service.config()).toEqual({ homeViewShowFavoritesOnly: false });
  });
});
