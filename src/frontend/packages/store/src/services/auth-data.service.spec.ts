import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RouterRedirect, SetAuthRedirect, VerifySession } from '../actions/auth.actions';
import { AuthState } from '../reducers/auth.reducer';
import { SessionData } from '../types/auth.types';
import { AuthDataService } from './auth-data.service';

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

describe('AuthDataService', () => {
  let auth$: BehaviorSubject<AuthState>;
  let dispatch: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    auth$ = new BehaviorSubject<AuthState>(makeAuthState());
    dispatch = vi.fn();
    navigate = vi.fn();
    const stubStore = {
      select: () => auth$.asObservable(),
      dispatch,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
        { provide: Router, useValue: { navigate } },
        AuthDataService,
      ],
    });
  });

  it('mirrors the default auth slice on construction', () => {
    const svc = TestBed.inject(AuthDataService);
    expect(svc.loggedIn()).toBe(false);
    expect(svc.loggingIn()).toBe(false);
    expect(svc.verifying()).toBe(false);
    expect(svc.error()).toBe(false);
    expect(svc.sessionData()).toBeNull();
    expect(svc.sessionValid()).toBe(false);
    expect(svc.redirect()).toBeUndefined();
  });

  it('reflects subsequent auth slice updates through projected signals', () => {
    const svc = TestBed.inject(AuthDataService);
    const sessionData = { valid: true } as unknown as SessionData;
    const redirect: RouterRedirect = { path: '/post-login' };

    auth$.next(makeAuthState({ loggedIn: true, sessionData, redirect }));

    expect(svc.loggedIn()).toBe(true);
    expect(svc.sessionData()).toBe(sessionData);
    expect(svc.sessionValid()).toBe(true);
    expect(svc.redirect()).toEqual(redirect);
  });

  it('dispatches VerifySession with login + updateEndpoints flags', () => {
    const svc = TestBed.inject(AuthDataService);
    svc.verifySession(true, true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0] as VerifySession;
    expect(action).toBeInstanceOf(VerifySession);
    expect(action.login).toBe(true);
    expect(action.updateEndpoints).toBe(true);
  });

  it('remembers the redirect via SetAuthRedirect and navigates through the Router', () => {
    const svc = TestBed.inject(AuthDataService);
    const redirect: RouterRedirect = { path: '/after' };
    svc.navigateAndRememberRedirect(['/login'], redirect);
    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0] as SetAuthRedirect;
    expect(action).toBeInstanceOf(SetAuthRedirect);
    expect(action.redirect).toEqual(redirect);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('splits a string path into segments when navigating', () => {
    const svc = TestBed.inject(AuthDataService);
    svc.navigateAndRememberRedirect('/login', { path: '/after' });
    expect(navigate).toHaveBeenCalledWith(['', 'login']);
  });
});
