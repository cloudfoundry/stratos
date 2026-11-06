import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { NEVER } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { UserInviteService, UserInviteSendSpaceRoles } from './user-invite.service';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CfCurrentUserRolesSignalService } from '../../../user-permissions/cf-current-user-roles-signal.service';
import { AuthDataService } from '@stratosui/store';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';

// ─── Minimal stubs ────────────────────────────────────────────────────────────

const stubCfEndpoint = { endpoint$: NEVER };
const stubActiveRoute = { cfGuid: '' };
const stubCfRoles = { cfEndpointRolesState$: () => NEVER };
const stubAuthData = { sessionData: signal(null) };
const stubPermissions = { can: () => NEVER };

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
        { provide: CfCurrentUserRolesSignalService, useValue: stubCfRoles },
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
