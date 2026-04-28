import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import type { AuthState, SessionData } from '@stratosui/store';

import { SessionService } from './session.service';

describe('SessionService', () => {
  let auth$: BehaviorSubject<AuthState>;

  function makeAuthState(sessionData: SessionData | null): AuthState {
    return {
      loggedIn: !!sessionData,
      loggingIn: false,
      verifying: false,
      error: false,
      errorResponse: null,
      sessionData,
    } as unknown as AuthState;
  }

  beforeEach(() => {
    auth$ = new BehaviorSubject<AuthState>(makeAuthState(null));

    const stubStore = {
      select: (selector: unknown) => {
        if (typeof selector === 'function') {
          return auth$.asObservable().pipe();
        }
        return auth$.asObservable();
      },
      dispatch: () => undefined,
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
        SessionService,
      ],
    });
  });

  it('exposes null sessionData when the store has no auth payload', () => {
    const service = TestBed.inject(SessionService);
    expect(service.sessionData()).toBeNull();
    expect(service.config()).toBeNull();
  });

  it('exposes sessionData and config once the auth state populates', () => {
    const sessionData = {
      valid: true,
      sessionExpiresOn: 0,
      plugins: { demo: false },
      config: { homeViewShowFavoritesOnly: true, listMaxSize: 100 },
    } as unknown as SessionData;

    auth$.next(makeAuthState(sessionData));

    const service = TestBed.inject(SessionService);
    expect(service.sessionData()).toBe(sessionData);
    expect(service.config()).toEqual({ homeViewShowFavoritesOnly: true, listMaxSize: 100 });
  });

  it('updates the signals when the auth state changes', () => {
    const service = TestBed.inject(SessionService);
    expect(service.config()).toBeNull();

    const newSession = {
      valid: true,
      sessionExpiresOn: 0,
      plugins: { demo: false },
      config: { homeViewShowFavoritesOnly: false },
    } as unknown as SessionData;

    auth$.next(makeAuthState(newSession));

    expect(service.config()).toEqual({ homeViewShowFavoritesOnly: false });
  });
});
