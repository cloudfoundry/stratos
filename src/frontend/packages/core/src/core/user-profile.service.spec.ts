import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SessionData, UserProfileInfo } from '@stratosui/store';
import { UserProfileDataService } from '@stratosui/store';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

import { AuthSignalService } from './signals/auth-signal.service';
import { UserProfileService } from './user-profile.service';

const SESSION: SessionData = {
  valid: true,
  user: { guid: 'user-1', name: 'admin', admin: true, scopes: [] },
  sessionExpiresOn: Date.now() + 60 * 60 * 1000,
  plugins: { demo: false },
  config: {},
};

const PROFILE = { id: 'user-1', userName: 'admin', emails: [] } as unknown as UserProfileInfo;

describe('UserProfileService', () => {
  let profile$: BehaviorSubject<UserProfileInfo | null>;
  let dataStub: {
    profile: WritableSignal<UserProfileInfo | null>;
    fetching: WritableSignal<boolean>;
    error: WritableSignal<boolean>;
    profile$: BehaviorSubject<UserProfileInfo | null>;
    fetching$: BehaviorSubject<boolean>;
    error$: BehaviorSubject<boolean>;
    fetch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    profile$ = new BehaviorSubject<UserProfileInfo | null>(null);
    const profile = signal<UserProfileInfo | null>(null);
    dataStub = {
      profile,
      fetching: signal(false),
      error: signal(false),
      profile$,
      fetching$: new BehaviorSubject<boolean>(false),
      error$: new BehaviorSubject<boolean>(false),
      fetch: vi.fn().mockImplementation(() => { profile.set(PROFILE); profile$.next(PROFILE); }),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthSignalService, useValue: { sessionData: signal<SessionData | null>(SESSION) } },
        { provide: UserProfileDataService, useValue: dataStub },
        UserProfileService,
      ],
    });
  });

  it('fetches the profile on first subscription to userProfile$', async () => {
    const service = TestBed.inject(UserProfileService);
    const profile = await new Promise<UserProfileInfo>(resolve =>
      service.userProfile$.pipe(first()).subscribe(resolve)
    );
    expect(dataStub.fetch).toHaveBeenCalledWith('user-1');
    expect(profile.id).toBe('user-1');
  });

  it('does not re-fetch on subsequent subscriptions', async () => {
    const service = TestBed.inject(UserProfileService);
    await new Promise(resolve => service.userProfile$.pipe(first()).subscribe(resolve));
    await new Promise(resolve => service.userProfile$.pipe(first()).subscribe(resolve));
    expect(dataStub.fetch).toHaveBeenCalledTimes(1);
  });

  it('fetchUserProfile still forces a fetch (explicit refresh)', async () => {
    const service = TestBed.inject(UserProfileService);
    await new Promise(resolve => service.userProfile$.pipe(first()).subscribe(resolve));
    service.fetchUserProfile();
    expect(dataStub.fetch).toHaveBeenCalledTimes(2);
  });

  it('gives no profile until one is loaded, and loads it once', async () => {
    const service = TestBed.inject(UserProfileService);
    expect(service.userProfile()).toBeNull();
    expect(dataStub.fetch).not.toHaveBeenCalled();

    service.loadUserProfile();
    service.loadUserProfile();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataStub.fetch).toHaveBeenCalledTimes(1);
    expect(service.userProfile()?.id).toBe('user-1');
  });

  it('keeps the last error answer while a fetch runs', () => {
    const service = TestBed.inject(UserProfileService);
    dataStub.error.set(true);
    expect(service.isError()).toBe(true);

    dataStub.fetching.set(true);
    dataStub.error.set(false);
    expect(service.isError()).toBe(true);

    dataStub.fetching.set(false);
    expect(service.isError()).toBe(false);
  });
});
