import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject } from '@angular/core';
import { TailwindSnackBarService } from '@stratosui/core';
import { AuthDataService } from '@stratosui/store';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { environment } from '../../../../../core/src/environments/environment.prod';
import { ConfirmationDialogConfig } from '../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { ICfRolesState } from '../../../store/types/cf-current-user-roles.types';
import { CfCurrentUserRolesDataService } from '../../../services/cf-current-user-roles-data.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';

const { proxyAPIVersion } = environment;

export interface UserInviteBaseResponse {
  error: boolean;
  errorMessage?: string;
}

export interface UserInviteResponseUaa {
  failed_invites: UserInviteResponseUaaSection[];
  new_invites: UserInviteResponseUaaSection[];
}

export interface UserInviteResponseUaaSection {
  email: string;
  errorCode: string;
  errorMessage: string;
  inviteLink: string;
  success: boolean;
  userid: string;
}

export interface UserInviteSendResponse extends UserInviteBaseResponse, UserInviteResponseUaa {
}

export enum UserInviteSendSpaceRoles {
  developer = 'developer',
  auditor = 'auditor',
  manager = 'manager'
}

interface UserInviteSend {
  org: string;
  space: string;
  spaceRoles: { [spaceRole: string]: boolean; };
  emails: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserInviteConfigureService {
  private http = inject(HttpClient);
  private snackBar = inject(TailwindSnackBarService);
  private confirmDialog = inject(ConfirmationDialogService);


  configure(cfGUID: string, clientID: string, clientSecret: string): Observable<UserInviteBaseResponse> {
    const formData: FormData = new FormData();
    formData.append('client_id', clientID);
    formData.append('client_secret', clientSecret);
    const url = `/pp/${proxyAPIVersion}/invite/${cfGUID}`;
    const obs$ = this.http.post(url, formData).pipe(
      map(_v => {
        return {
          error: false
        };
      }),
      catchError(err => {
        let message = 'Failed to configure User Invitation';
        if (err && err.error && err.error.error) {
          message = err.error.error;
        }
        return observableOf({
          error: true,
          errorMessage: message
        });
      })
    );
    return obs$;
  }

  unconfigure(cfGUID: string) {
    const confirmation = new ConfirmationDialogConfig(
      'Disable User Invitations',
      `Are you sure you want to disable user invitation support?`,
      'Disable'
    );
    this.confirmDialog.open(confirmation, () => {
      const url = `/pp/${proxyAPIVersion}/invite/${cfGUID}`;
      this.http.delete(url).pipe(
        map(_v => {
          return {
            error: false,
            errorMessage: ''
          };
        }),
        catchError(err => {
          let message = 'Failed to configure User Invitation';
          if (err && err.error && err.error.error) {
            message = err.error.error;
          }
          return observableOf({
            error: true,
            errorMessage: message
          });
        })
      ).subscribe(res => {
        if (res.error) {
          this.snackBar.error(res.errorMessage, 'Close');
        }
      });
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserInviteService {
  private authData = inject(AuthDataService);
  private rolesData = inject(CfCurrentUserRolesDataService);
  private http = inject(HttpClient);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);


  /** Whether the CF endpoint allows user invitations; false until the
   *  endpoint record has loaded. */
  readonly configured: Signal<boolean>;
  /** Whether the user may configure invitations; false until the roles have loaded. */
  readonly canConfigure: Signal<boolean>;
  private readonly cfRolesState: Signal<ICfRolesState | null>;
  private readonly endpointLoaded: Signal<boolean>;

  constructor() {
    const cfEndpointService = inject(CloudFoundryEndpointService);

    this.configured = computed(() => {
      // metadata is missing when no SMTP server or other invite
      // settings are configured
      const metadata = cfEndpointService.endpoint()?.entity?.metadata;
      return !!metadata && metadata.userInviteAllowed === 'true';
    });
    this.endpointLoaded = computed(() => !!cfEndpointService.endpoint()?.entity);

    this.cfRolesState = this.rolesData.cfEndpointRolesState(this.activeRouteCfOrgSpace.cfGuid);
    this.canConfigure = computed(() => {
      const cf = this.cfRolesState();
      if (!cf?.state.initialised) {
        return false;
      }
      const sessionData = this.authData.sessionData();
      return cf.global.isAdmin &&
        !!sessionData?.['plugin-config'] && sessionData['plugin-config'].userInvitationsEnabled === 'true';
    });
  }

  /**
   * Whether to offer inviting users to the org or space; null until the
   * endpoint and the roles have loaded.
   */
  canShowInviteUser(cfGuid: string, orgGuid: string, spaceGuid: string): Signal<boolean | null> {
    // Can only invite someone to an org or space and user must be admin or org manager
    if (!orgGuid) {
      return computed(() => false);
    }
    const canChangeRoles = this.currentUserPermissionsService.can(
      CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES,
      cfGuid,
      orgGuid,
      spaceGuid
    );
    const rolesState = this.rolesData.cfEndpointRolesState(cfGuid);
    return computed(() => {
      if (!rolesState()?.state.initialised || !this.endpointLoaded()) {
        return null;
      }
      return this.configured() && canChangeRoles();
    });
  }

  invite(cfGuid: string, orgGuid: string, spaceGuid: string, spaceRole: UserInviteSendSpaceRoles, emails: string[]):
    Observable<UserInviteSendResponse> {
    const users: UserInviteSend = {
      org: orgGuid,
      space: spaceGuid,
      spaceRoles: spaceRole ? { [spaceRole]: true } : {},
      emails
    };
    return this.http.post<UserInviteResponseUaa>(`/pp/${proxyAPIVersion}/invite/send/${cfGuid}`, users).pipe(
      map((response: UserInviteResponseUaa) => ({
        error: response.failed_invites.length > 0,
        ...response
      })),
      catchError(err => observableOf({
        error: true,
        errorMessage: err && err.error && err.error.error ?
          err.error.error :
          `Failed to either create ${emails.length === 1 ? 'user' : 'users'} or add basic roles`,
        failed_invites: [],
        new_invites: []
      }))
    );
  }
}
