import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { proxyAPIVersion } from '../jetstream';
import { UserProfileInfo } from '../types/user-profile.types';
import { UserProfileDataService } from './user-profile-data.service';

const usersUrl = (guid: string) => `/pp/${proxyAPIVersion}/users/${guid}`;

const profile = (id = 'user-1', version = 3): UserProfileInfo => ({
  id,
  name: { givenName: 'Ada', familyName: 'Lovelace' },
  userName: 'ada',
  meta: { version, created: '', lastModified: '' },
  verified: true,
  active: true,
  emails: [{ primary: true, value: 'ada@example.com' }],
  passwordLastModified: '',
  schemas: [],
  zoneId: '',
  origin: 'uaa',
} as UserProfileInfo);

describe('UserProfileDataService', () => {
  let svc: UserProfileDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        UserProfileDataService,
      ],
    });
    svc = TestBed.inject(UserProfileDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts with no profile, not fetching, not errored', () => {
    expect(svc.profile()).toBeNull();
    expect(svc.fetching()).toBe(false);
    expect(svc.error()).toBe(false);
  });

  describe('fetch', () => {
    it('GETs the user and stores the profile; toggles fetching around the request', () => {
      const p = profile();
      svc.fetch('user-1');
      expect(svc.fetching()).toBe(true);

      const req = httpMock.expectOne(usersUrl('user-1'));
      expect(req.request.method).toBe('GET');
      req.flush(p);

      expect(svc.fetching()).toBe(false);
      expect(svc.error()).toBe(false);
      expect(svc.profile()).toEqual(p);
    });

    it('sets error and clears fetching on failure', () => {
      svc.fetch('user-1');
      httpMock.expectOne(usersUrl('user-1')).flush('boom', { status: 500, statusText: 'Server Error' });
      expect(svc.fetching()).toBe(false);
      expect(svc.error()).toBe(true);
      expect(svc.profile()).toBeNull();
    });

    it('profile$ emits the fetched profile', async () => {
      const p = profile();
      svc.fetch('user-1');
      httpMock.expectOne(usersUrl('user-1')).flush(p);
      const emitted = await firstValueFrom(svc.profile$.pipe(filter(Boolean), take(1)));
      expect(emitted).toEqual(p);
    });
  });

  describe('updateProfile', () => {
    it('PUTs the profile with If-Match version + password header and resolves to a non-busy ActionState', async () => {
      const p = profile('user-1', 7);
      const state$ = svc.updateProfile(p, 'currentpw');
      const done = firstValueFrom(state$);

      const req = httpMock.expectOne(usersUrl('user-1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('If-Match')).toBe('7');
      expect(req.request.headers.get('x-stratos-password')).toBe('currentpw');
      expect(req.request.body).toEqual(p);
      req.flush({});

      const state = await done;
      expect(state.busy).toBe(false);
      expect(state.error).toBe(false);
    });

    it('omits the password header when no current password is supplied', () => {
      const p = profile();
      svc.updateProfile(p).subscribe();
      const req = httpMock.expectOne(usersUrl('user-1'));
      expect(req.request.headers.has('x-stratos-password')).toBe(false);
      req.flush({});
    });

    it('resolves to an errored ActionState on failure', async () => {
      const p = profile();
      const done = firstValueFrom(svc.updateProfile(p, 'pw'));
      httpMock.expectOne(usersUrl('user-1')).flush('no', { status: 412, statusText: 'Precondition Failed' });
      const state = await done;
      expect(state.busy).toBe(false);
      expect(state.error).toBe(true);
    });
  });

  describe('updatePassword', () => {
    it('PUTs to /{id}/password with old+new password headers and resolves non-busy', async () => {
      const done = firstValueFrom(svc.updatePassword('user-1', { oldPassword: 'old', password: 'new' }));
      const req = httpMock.expectOne(`${usersUrl('user-1')}/password`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('x-stratos-password')).toBe('old');
      expect(req.request.headers.get('x-stratos-password-new')).toBe('new');
      req.flush({});
      const state = await done;
      expect(state.busy).toBe(false);
      expect(state.error).toBe(false);
    });

    it('resolves errored on failure', async () => {
      const done = firstValueFrom(svc.updatePassword('user-1', { oldPassword: 'old', password: 'new' }));
      httpMock.expectOne(`${usersUrl('user-1')}/password`).flush('no', { status: 401, statusText: 'Unauthorized' });
      const state = await done;
      expect(state.error).toBe(true);
    });
  });
});
