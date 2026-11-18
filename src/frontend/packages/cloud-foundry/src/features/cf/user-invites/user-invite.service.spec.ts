import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { UserInviteService, UserInviteSendSpaceRoles } from './user-invite.service';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CfCurrentUserRolesDataService } from '../../../services/cf-current-user-roles-data.service';
import { AuthDataService } from '@stratosui/store';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';

// ─── Minimal stubs ────────────────────────────────────────────────────────────

const stubCfEndpoint = { endpoint: signal(undefined) };
const stubActiveRoute = { cfGuid: '' };
const stubCfRoles = { cfEndpointRolesState: () => signal(null) };
const stubAuthData = { sessionData: signal(null) };
const stubPermissions = { can: () => signal(false) };

describe('UserInviteService.invite', () => {
  let svc: UserInviteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CloudFoundryEndpointService, useValue: stubCfEndpoint },
        { provide: ActiveRouteCfOrgSpace, useValue: stubActiveRoute },
        { provide: CfCurrentUserRolesDataService, useValue: stubCfRoles },
        { provide: AuthDataService, useValue: stubAuthData },
        { provide: CurrentUserPermissionsService, useValue: stubPermissions },
        UserInviteService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(UserInviteService);
  });

  it('sends spaceRoles: { developer: true } when a real role is passed', () => {
    const obs = svc.invite('cf1', 'org1', 'sp1', UserInviteSendSpaceRoles.developer, ['alice@example.com']);
    firstValueFrom(obs).catch(() => {/* ignore */});

    const req = httpMock.expectOne('/pp/v1/invite/send/cf1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.spaceRoles).toEqual({ developer: true });
    req.flush({ new_invites: [], failed_invites: [] });
    httpMock.verify();
  });

  it('sends spaceRoles: {} (genuinely empty) when spaceRole is the empty sentinel', () => {
    // The addUsers orchestrator passes '' as UserInviteSendSpaceRoles for
    // role-free invites. invite() must produce an empty spaceRoles object,
    // NOT { '': true } which would send a junk role key to the backend.
    const obs = svc.invite('cf1', 'org1', 'sp1', '' as UserInviteSendSpaceRoles, ['bob@example.com']);
    firstValueFrom(obs).catch(() => {/* ignore */});

    const req = httpMock.expectOne('/pp/v1/invite/send/cf1');
    expect(req.request.body.spaceRoles).toEqual({});
    req.flush({ new_invites: [], failed_invites: [] });
    httpMock.verify();
  });
});

describe('UserInviteService.configured', () => {
  const endpoint = signal<unknown>(undefined);

  beforeEach(() => {
    endpoint.set(undefined);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CloudFoundryEndpointService, useValue: { endpoint } },
        { provide: ActiveRouteCfOrgSpace, useValue: stubActiveRoute },
        { provide: CfCurrentUserRolesDataService, useValue: stubCfRoles },
        { provide: AuthDataService, useValue: stubAuthData },
        { provide: CurrentUserPermissionsService, useValue: stubPermissions },
        UserInviteService,
      ],
    });
  });

  it('is false until the endpoint has loaded', () => {
    expect(TestBed.inject(UserInviteService).configured()).toBe(false);
  });

  it('is true only when the endpoint allows invitations', () => {
    const svc = TestBed.inject(UserInviteService);
    endpoint.set({ entity: { metadata: { userInviteAllowed: 'false' } } });
    expect(svc.configured()).toBe(false);
    endpoint.set({ entity: {} });
    expect(svc.configured()).toBe(false);
    endpoint.set({ entity: { metadata: { userInviteAllowed: 'true' } } });
    expect(svc.configured()).toBe(true);
  });
});

describe('UserInviteService.canShowInviteUser', () => {
  const endpoint = signal<unknown>(undefined);
  const canChangeRoles = signal(true);
  const roles = signal<unknown>({ state: { initialised: true } });

  beforeEach(() => {
    endpoint.set(undefined);
    canChangeRoles.set(true);
    roles.set({ state: { initialised: true } });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CloudFoundryEndpointService, useValue: { endpoint } },
        { provide: ActiveRouteCfOrgSpace, useValue: stubActiveRoute },
        { provide: CfCurrentUserRolesDataService, useValue: {
          cfEndpointRolesState: () => roles,
        } },
        { provide: AuthDataService, useValue: stubAuthData },
        { provide: CurrentUserPermissionsService, useValue: { can: () => canChangeRoles } },
        UserInviteService,
      ],
    });
  });

  it('waits for the endpoint before answering', () => {
    const svc = TestBed.inject(UserInviteService);
    const can = svc.canShowInviteUser('cf1', 'org1', '');
    expect(can()).toBeNull();

    endpoint.set({ entity: { metadata: { userInviteAllowed: 'true' } } });
    expect(can()).toBe(true);
  });

  it('waits for the roles before answering', () => {
    roles.set(null);
    endpoint.set({ entity: { metadata: { userInviteAllowed: 'true' } } });
    const svc = TestBed.inject(UserInviteService);
    const can = svc.canShowInviteUser('cf1', 'org1', '');
    expect(can()).toBeNull();

    roles.set({ state: { initialised: true } });
    expect(can()).toBe(true);
  });

  it('does not offer invites without the org role-change permission', () => {
    canChangeRoles.set(false);
    const svc = TestBed.inject(UserInviteService);
    endpoint.set({ entity: { metadata: { userInviteAllowed: 'true' } } });
    expect(svc.canShowInviteUser('cf1', 'org1', '')()).toBe(false);
  });

  it('offers invites to no one outside an organization', () => {
    const svc = TestBed.inject(UserInviteService);
    expect(svc.canShowInviteUser('cf1', '', '')()).toBe(false);
  });
});
