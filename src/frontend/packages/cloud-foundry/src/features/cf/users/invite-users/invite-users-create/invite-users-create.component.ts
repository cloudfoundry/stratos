import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  SignalStepHandle,
  StackedInputActionResult,
  StackedInputActionsComponent,
  StackedInputActionsState,
  StackedInputActionsUpdate,
  StepOnNextFunction,
} from '@stratosui/core';
import { APIResource, ClearPaginationOfType } from '@stratosui/store';
import { IOrganization, ISpace } from '../../../../../cf-api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfUserEntityType } from '../../../../../cf-entity-types';
import { CFEntityConfig } from '../../../../../cf-types';
import { SpaceUserRoleNames } from '../../../../../store/types/cf-user.types';
import { UserRoleLabels } from '../../../../../store/types/users-roles.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { UserInviteSendSpaceRoles, UserInviteService } from '../../../user-invites/user-invite.service';

@Component({
  selector: 'app-invite-users-create',
  templateUrl: './invite-users-create.component.html',
  styleUrls: ['./invite-users-create.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    StackedInputActionsComponent
  ]
})
export class InviteUsersCreateComponent implements OnInit {
  private store = inject<Store<CFAppState>>(Store);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private userInviteService = inject(UserInviteService);
  private router = inject(Router);


  public stepValid = signal<boolean>(false);
  public valid$: Observable<boolean>;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: signal-native step handle. Reuses the existing onNext side
   * effects (per-user state updates, pagination clear) by awaiting the
   * same observable, then navigates to the parent-supplied redirectUrl
   * unless the top-level invite call errored. Partial-failure semantics
   * are preserved: when any user succeeds the redirect still happens.
   */
  signalHandle: SignalStepHandle = {
    valid: this.stepValid.asReadonly(),
    submit: async () => {
      const res = await firstValueFrom(this.runInvite());
      if (res.error) {
        throw new Error(res.errorMessage || 'Failed to invite users');
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };
  public stateIn = signal<StackedInputActionsState[]>([]);
  public stateIn$: Observable<StackedInputActionsState[]>;
  public org$!: Observable<APIResource<IOrganization>>;
  public space$!: Observable<APIResource<ISpace> | null>;
  public madeChanges = false;
  public isSpace = false;
  public spaceRole: UserInviteSendSpaceRoles = UserInviteSendSpaceRoles.auditor;
  public spaceRoles: { label: string, value: UserInviteSendSpaceRoles }[] = [];
  private users!: StackedInputActionsUpdate;

  constructor() {
    this.valid$ = toObservable(this.stepValid);
    this.stateIn$ = toObservable(this.stateIn);
    this.spaceRoles.push(
      {
        label: UserRoleLabels.space.short[SpaceUserRoleNames.AUDITOR],
        value: UserInviteSendSpaceRoles.auditor,
      }, {
        label: UserRoleLabels.space.short[SpaceUserRoleNames.DEVELOPER],
        value: UserInviteSendSpaceRoles.developer,
      }, {
        label: UserRoleLabels.space.short[SpaceUserRoleNames.MANAGER],
        value: UserInviteSendSpaceRoles.manager,
      });
  }

  stateOut(users: StackedInputActionsUpdate) {
    this.users = users;
    this.stepValid.set(users.valid);
  }

  ngOnInit() {
    this.isSpace = !!this.activeRouteCfOrgSpace.spaceGuid;
    this.org$ = cfEntityCatalog.org.store.getEntityService(
      this.activeRouteCfOrgSpace.orgGuid,
      this.activeRouteCfOrgSpace.cfGuid,
      { includeRelations: [], populateMissing: false }
    ).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
    this.space$ = this.isSpace ? cfEntityCatalog.space.store.getEntityService(
      this.activeRouteCfOrgSpace.spaceGuid,
      this.activeRouteCfOrgSpace.cfGuid,
      { includeRelations: [], populateMissing: false }
    ).waitForEntity$.pipe(
      map(entity => entity.entity)
    ) : observableOf(null);
  }

  /**
   * FWT-957 helper: runs the invite request and applies per-user state
   * updates / madeChanges side effects. Returns the invite response so
   * both the legacy onNext map and the new SignalStepHandle.submit path
   * can branch on res.error uniformly.
   */
  private runInvite() {
    // Mark all as processing
    const processingState: StackedInputActionsState[] = [];
    Object.keys(this.users.values).forEach(key => {
      processingState.push({
        key,
        result: StackedInputActionResult.PROCESSING,
      });
    });
    this.stateIn.set(processingState);

    // Kick off the invites
    return this.userInviteService.invite(
      this.activeRouteCfOrgSpace.cfGuid,
      this.activeRouteCfOrgSpace.orgGuid,
      this.activeRouteCfOrgSpace.spaceGuid,
      this.spaceRole,
      Object.values(this.users.values)).pipe(
        map(res => {
          if (!res.error && res.failed_invites.length === 0) {
            // Success! Clear all paginations of type users such that lists can be refetched with new user.s
            this.store.dispatch(new ClearPaginationOfType(new CFEntityConfig(cfUserEntityType)));
          } else if (res.failed_invites.length > 0) {
            // One or more failed. Push failures back into components
            const newState: StackedInputActionsState[] = [];
            Object.entries(this.users.values).forEach(([key, email]) => {
              // Update failed users
              const failed = res.failed_invites.find(invite => invite.email === email);
              if (failed) {
                newState.push({
                  key,
                  result: StackedInputActionResult.FAILED,
                  message: failed.errorMessage
                });
                return;
              }
              // Update succeeded users
              const succeeded = res.new_invites.find(invite => invite.email === email);
              if (succeeded) {
                this.madeChanges = true;
                newState.push({
                  key,
                  result: StackedInputActionResult.SUCCEEDED,
                });
                return;
              }
              // Can't find user for unknown reason, set to failed so it can be tried again
              newState.push({
                key,
                result: StackedInputActionResult.FAILED,
                message: 'No response for user found'
              });
            });
            // We've just come from a valid state, so form should be valid again
            this.stepValid.set(true);
            this.stateIn.set(newState);
            res.errorMessage = 'Failed to invite one or more users. Please address per user message and try again';
          }
          return res;
        }),
      );
  }

  onNext: StepOnNextFunction = () => this.runInvite().pipe(
    map(res => ({
      success: !res.error,
      message: res.errorMessage,
      redirect: !res.error
    })),
  );

}
