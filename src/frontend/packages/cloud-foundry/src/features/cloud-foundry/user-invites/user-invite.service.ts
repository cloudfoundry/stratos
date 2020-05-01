import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { CurrentUserPermissions } from '../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/current-user-permissions.service';
import { environment } from '../../../../../core/src/environments/environment.prod';
import { ConfirmationDialogConfig } from '../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { GetSystemInfo } from '../../../../../store/src/actions/system.actions';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { waitForCFPermissions } from '../cf.helpers';
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
  spaceRoles: { [spaceRole: string]: boolean };
  emails: string[];
}

@Injectable()
export class UserInviteConfigureService {

  constructor(
    private store: Store<CFAppState>,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private confirmDialog: ConfirmationDialogService,
  ) { }

  configure(cfGUID: string, clientID: string, clientSecret: string): Observable<UserInviteBaseResponse> {
    const formData: FormData = new FormData();
    formData.append('client_id', clientID);
    formData.append('client_secret', clientSecret);
    const url = `/pp/${proxyAPIVersion}/invite/${cfGUID}`;
    const obs$ = this.http.post(url, formData).pipe(
      map(v => {
        this.store.dispatch(new GetSystemInfo());
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
        map(v => {
          this.store.dispatch(new GetSystemInfo());
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
          this.snackBar.open(res.errorMessage, 'Close');
        }
      });
    });
  }
}

@Injectable()
export class UserInviteService {

  configured$: Observable<boolean>;
  enabled$: Observable<boolean>;
  canConfigure$: Observable<boolean>;

  constructor(
    private store: Store<CFAppState>,
    private http: HttpClient,
    cfEndpointService: CloudFoundryEndpointService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.configured$ = cfEndpointService.endpoint$.pipe(
      filter(v => !!v && !!v.entity),
      // Note - metadata could be falsy if smtp server not configured/other metadata properties are missing
      map(v => v.entity.metadata && v.entity.metadata.userInviteAllowed === 'true')
    );

    this.canConfigure$ = combineLatest(
      waitForCFPermissions(this.store, this.activeRouteCfOrgSpace.cfGuid),
      this.store.select('auth')
    ).pipe(
      map(([cf, auth]) =>
        cf.global.isAdmin &&
        auth.sessionData['plugin-config'] && auth.sessionData['plugin-config'].userInvitationsEnabled === 'true')
    );
  }



  canShowInviteUser(cfGuid: string, orgGuid: string, spaceGuid: string): Observable<boolean> {
    // Can only invite someone to an org or space and user must be admin or org manager
    return !orgGuid ? observableOf(false) : waitForCFPermissions(this.store, cfGuid).pipe(
      switchMap(() => combineLatest(
        this.configured$,
        this.currentUserPermissionsService.can(
          CurrentUserPermissions.ORGANIZATION_CHANGE_ROLES,
          cfGuid,
          orgGuid,
          spaceGuid
        )
      )),
      map(([configured, canChangeRoles]) => !!configured && !!canChangeRoles)
    );
  }

  invite(cfGuid: string, orgGuid: string, spaceGuid: string, spaceRole: UserInviteSendSpaceRoles, emails: string[]):
    Observable<UserInviteSendResponse> {
    const users: UserInviteSend = {
      org: orgGuid,
      space: spaceGuid,
      spaceRoles: {
        [spaceRole]: true
      },
      emails
    };
    return this.http.post(`/pp/${proxyAPIVersion}/invite/send/${cfGuid}`, users).pipe(
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
