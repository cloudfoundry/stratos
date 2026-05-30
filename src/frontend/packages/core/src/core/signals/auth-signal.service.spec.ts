import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthState, SessionData } from '@stratosui/store';
import { Login, Logout } from '@stratosui/store';

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
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    auth$ = new BehaviorSubject<AuthState>(makeAuthState());
    dispatch = vi.fn();
    const stubStore = {
      select: () => auth$.asObservable(),
      dispatch,
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

  it('delegates login() to the data service Login dispatch', () => {
    const service = TestBed.inject(AuthSignalService);
    service.login('alice', 's3cret');
    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0] as Login;
    expect(action).toBeInstanceOf(Login);
    expect(action.username).toBe('alice');
    expect(action.password).toBe('s3cret');
  });

  it('delegates logout() to the data service Logout dispatch', () => {
    const service = TestBed.inject(AuthSignalService);
    service.logout();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toBeInstanceOf(Logout);
  });
});
