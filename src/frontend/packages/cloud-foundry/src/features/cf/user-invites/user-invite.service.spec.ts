import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { UserInviteConfigureService, UserInviteService, UserInviteSendSpaceRoles } from './user-invite.service';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CfCurrentUserRolesDataService } from '../../../services/cf-current-user-roles-data.service';
import { TailwindSnackBarService } from '@stratosui/core';
import { AuthDataService, EndpointsDataService } from '@stratosui/store';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';

// ─── Minimal stubs ────────────────────────────────────────────────────────────

const stubCfEndpoint = { endpoint: signal(undefined) };
const stubActiveRoute = { cfGuid: '' };
const stubCfRoles = { cfEndpointRolesState: () => signal(null) };
const stubAuthData = { sessionData: signal(null) };

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

// The endpoint list carries metadata.userInviteAllowed, so after the invite
// client is configured or removed the list is fetched again; without it the
// Summary row and the invite links keep the old answer until a reload.
describe('UserInviteConfigureService refreshes the endpoints', () => {
  let svc: UserInviteConfigureService;
  let http: HttpTestingController;
  const getAll = vi.fn();

  beforeEach(() => {
    getAll.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EndpointsDataService, useValue: { getAll } },
        { provide: TailwindSnackBarService, useValue: { error: vi.fn() } },
        // Answers the "Disable" confirmation at once.
        { provide: ConfirmationDialogService, useValue: { open: (_c: unknown, onConfirm: () => void) => onConfirm() } },
      ],
    });
    svc = TestBed.inject(UserInviteConfigureService);
    http = TestBed.inject(HttpTestingController);
  });

  it('after a successful configure', async () => {
    const result = firstValueFrom(svc.configure('cf-1', 'client', 'secret'));
    http.expectOne({ method: 'POST', url: '/pp/v1/invite/cf-1' }).flush({});
    expect((await result).error).toBe(false);
    expect(getAll).toHaveBeenCalledWith(false);
  });

  it('not after a failed configure', async () => {
    const result = firstValueFrom(svc.configure('cf-1', 'client', 'wrong'));
    http.expectOne('/pp/v1/invite/cf-1').flush({ error: 'bad client' }, { status: 400, statusText: 'Bad Request' });
    expect((await result).error).toBe(true);
    expect(getAll).not.toHaveBeenCalled();
  });

  it('after a successful disable', () => {
    svc.unconfigure('cf-1');
    http.expectOne({ method: 'DELETE', url: '/pp/v1/invite/cf-1' }).flush({});
    expect(getAll).toHaveBeenCalledWith(false);
  });
});
