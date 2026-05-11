import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { AuthState, SessionData } from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

function makeAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    loggedIn: false,
    loggingIn: false,
    verifying: false,
    error: false,
    errorResponse: null,
    user: null,
    sessionData: null,
    ...overrides,
  } as AuthState;
}

describe('AuthSignalService', () => {
  let auth$: BehaviorSubject<AuthState>;

  beforeEach(() => {
    auth$ = new BehaviorSubject<AuthState>(makeAuthState());
    const stubStore = {
      select: () => auth$.asObservable(),
      dispatch: () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
        AuthSignalService,
      ],
    });
  });

  it('exposes default-shaped auth signals before any data arrives', () => {
    const service = TestBed.inject(AuthSignalService);
    expect(service.loggedIn()).toBe(false);
    expect(service.loggingIn()).toBe(false);
    expect(service.verifying()).toBe(false);
    expect(service.error()).toBe(false);
    expect(service.sessionData()).toBeNull();
    expect(service.sessionValid()).toBe(false);
    expect(service.loginCompletedAt()).toBe(0);
  });

  it('reflects auth slice updates through the projected signals', () => {
    const sessionData = { valid: true } as unknown as SessionData;
    auth$.next(makeAuthState({ loggedIn: true, sessionData }));

    const service = TestBed.inject(AuthSignalService);
    expect(service.loggedIn()).toBe(true);
    expect(service.sessionData()).toBe(sessionData);
    expect(service.sessionValid()).toBe(true);
  });

  it('emits loginCompletedAt only on a false→true loggedIn transition', () => {
    const service = TestBed.inject(AuthSignalService);
    expect(service.loggedIn()).toBe(false);
    flushEffects();
    expect(service.loginCompletedAt()).toBe(0);

    auth$.next(makeAuthState({ loggedIn: true, sessionData: { valid: true } as SessionData }));
    flushEffects();

    const firstStamp = service.loginCompletedAt();
    expect(firstStamp).toBeGreaterThan(0);

    // Steady-state re-emit with same loggedIn=true must not bump the timestamp.
    auth$.next(makeAuthState({ loggedIn: true, sessionData: { valid: true } as SessionData }));
    flushEffects();
    expect(service.loginCompletedAt()).toBe(firstStamp);
  });
});
