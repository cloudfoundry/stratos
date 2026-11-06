import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
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
} as SessionData;

const PROFILE = { id: 'user-1', userName: 'admin', emails: [] } as unknown as UserProfileInfo;

describe('UserProfileService', () => {
  let profile$: BehaviorSubject<UserProfileInfo | null>;
  let dataStub: {
    profile$: BehaviorSubject<UserProfileInfo | null>;
    fetching$: BehaviorSubject<boolean>;
    error$: BehaviorSubject<boolean>;
    fetch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    profile$ = new BehaviorSubject<UserProfileInfo | null>(null);
    dataStub = {
      profile$,
      fetching$: new BehaviorSubject<boolean>(false),
      error$: new BehaviorSubject<boolean>(false),
      fetch: vi.fn().mockImplementation(() => profile$.next(PROFILE)),
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
});
