import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import {
  StackedInputActionResult,
} from '../../../../../shared/components/stacked-input-actions/stacked-input-action/stacked-input-action.component';
import {
  StackedInputActionsState,
  StackedInputActionsUpdate,
} from '../../../../../shared/components/stacked-input-actions/stacked-input-actions.component';
import { StepOnNextFunction } from '../../../../../shared/components/stepper/step/step.component';
import { GetOrganization } from '../../../../../store/actions/organization.actions';
import { GetSpace } from '../../../../../store/actions/space.actions';
import { UsersRolesSetUsers } from '../../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser, SpaceUserRoleNames } from '../../../../../store/types/user.types';
import { UserRoleLabels } from '../../../../../store/types/users-roles.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { UserInviteSendSpaceRoles, UserInviteService } from '../../../user-invites/user-invite.service';

@Component({
  selector: 'app-invite-users-create',
  templateUrl: './invite-users-create.component.html',
  styleUrls: ['./invite-users-create.component.scss']
})
export class InviteUsersCreateComponent implements OnInit, OnDestroy {

  public valid$: Observable<boolean>;
  public stepValid = new BehaviorSubject<boolean>(false);
  public state = new BehaviorSubject<StackedInputActionsState[]>([]);
  public orgName$: Observable<string>;
  public org$: Observable<APIResource<IOrganization>>;
  public spaceName$: Observable<string>;
  public space$: Observable<APIResource<ISpace>>;
  public isSpace = false;
  public spaceRole: UserInviteSendSpaceRoles = UserInviteSendSpaceRoles.auditor;
  public spaceRoles: { label: string, value: UserInviteSendSpaceRoles }[] = [];
  private users: StackedInputActionsUpdate;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
    private userInviteService: UserInviteService
  ) {
    this.valid$ = this.stepValid.asObservable();
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

  updateUsers(users: StackedInputActionsUpdate) {
    this.users = users;
    this.stepValid.next(users.valid);
  }

  ngOnInit() {
    this.isSpace = !!this.activeRouteCfOrgSpace.spaceGuid;
    this.org$ = this.entityServiceFactory.create<APIResource<IOrganization>>(
      organizationSchemaKey,
      entityFactory(organizationSchemaKey),
      this.activeRouteCfOrgSpace.orgGuid,
      new GetOrganization(this.activeRouteCfOrgSpace.orgGuid, this.activeRouteCfOrgSpace.cfGuid, [], false)
    ).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
    this.orgName$ = this.org$.pipe(
      map(entity => entity.entity.name)
    );
    this.space$ = this.isSpace ? this.entityServiceFactory.create<APIResource<ISpace>>(
      spaceSchemaKey,
      entityFactory(spaceSchemaKey),
      this.activeRouteCfOrgSpace.spaceGuid,
      new GetSpace(this.activeRouteCfOrgSpace.spaceGuid, this.activeRouteCfOrgSpace.cfGuid, [], false)
    ).waitForEntity$.pipe(
      map(entity => entity.entity)
    ) : observableOf(null);
    this.spaceName$ = this.isSpace ? this.space$.pipe(
      map(entity => entity.entity.name)
    ) : observableOf(null);
  }

  ngOnDestroy() {
    // if (this.orgGuidChangedSub) {
    //   this.orgGuidChangedSub.unsubscribe();
    // }
    // this.destroySpacesList();
    // if (this.snackBarRef) {
    //   this.snackBarRef.dismiss();
    //   this.snackBarRef = null;
    // }
  }


  onEnter = () => {
    // if (!this.snackBarRef) {
    //   this.usersWithWarning$.pipe(first()).subscribe((usersWithWarning => {
    //     if (usersWithWarning && usersWithWarning.length) {
    //       this.snackBarRef = this.snackBar.open(`Not all roles are shown for user/s - ${usersWithWarning.join(', ')}. To avoid this please
    //       navigate to a specific organization or space`, 'Dismiss');
    //     }
    //   }));
    // }

    // let iteration = 1;
    // setInterval(() => {
    //   if (iteration % 3 === 0) {
    //     this.state.next([{
    //       key: '1',
    //       result: StackedInputActionResult.FAILED,
    //       message: 'FAILED'
    //     }]);
    //   } else if (iteration % 2 === 0) {
    //     this.state.next([{
    //       key: '1',
    //       result: StackedInputActionResult.SUCCEEDED,
    //       message: 'SUCCEEDED'
    //     }]);
    //   } else if (iteration % 1 === 0) {
    //     this.state.next([{
    //       key: '1',
    //       result: StackedInputActionResult.PROCESSING,
    //       message: 'PROCESSING'
    //     }]);
    //   }
    //   iteration++;
    // }, 5000);
  }

  onLeave = (isNext: boolean) => {
    // if (!isNext && this.snackBarRef) {
    //   this.snackBarRef.dismiss();
    //   this.snackBarRef = null;
    // }
  }

  onNext: StepOnNextFunction = () => {
    // this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, [user.entity]));
    // TODO: RC what happens if some pass and some fail? Do we re-attempt the passed/automatically remove inputs/ignore on retry?

    // Mark all as processing
    const processingState: StackedInputActionsState[] = [];
    this.users.values.forEach(() => {
      processingState.push({
        key: 'I dont know',
        result: StackedInputActionResult.PROCESSING,
      });
    });
    this.state.next(processingState);
    // this.users.values = ['sdfdsfdsfdsf', 'test@test.com'];

    // Kick off the invites
    return combineLatest(
      this.userInviteService.invite(
        this.activeRouteCfOrgSpace.cfGuid,
        this.activeRouteCfOrgSpace.orgGuid,
        this.activeRouteCfOrgSpace.spaceGuid,
        this.spaceRole,
        this.users.values),
      this.org$,
      this.space$
    ).pipe(
      tap(([res, org, space]) => {
        if (!res.error && res.failed_invites.length === 0) {
          // TODO: RC check for existing user
          const newUsers: CfUser[] = res.new_invites.map(invite => ({
            organizations: [org],
            managed_organizations: [],
            billing_managed_organizations: [],
            audited_organizations: [],
            admin: false,
            spaces: space && this.spaceRole === UserInviteSendSpaceRoles.developer ? [space] : [],
            managed_spaces: space && this.spaceRole === UserInviteSendSpaceRoles.manager ? [space] : [],
            audited_spaces: space && this.spaceRole === UserInviteSendSpaceRoles.auditor ? [space] : [],
            cfGuid: this.activeRouteCfOrgSpace.cfGuid,
            guid: invite.userid,
            username: invite.email,
            active: true, // TODO: RC CHECK
            spaces_url: '',
            organizations_url: '',
            managed_organizations_url: '',
            billing_managed_organizations_url: '',
            audited_organizations_url: '',
            managed_spaces_url: '',
            audited_spaces_url: '',
            default_space_guid: '',
          }));

          this.store.dispatch(new UsersRolesSetUsers(this.activeRouteCfOrgSpace.cfGuid, newUsers));

        } else if (res.failed_invites.length > 0) {
          // Push failures back into components
          const newState: StackedInputActionsState[] = [];
          this.users.values.forEach(email => {
            // Update failed users
            const failed = res.failed_invites.find(invite => invite.email === email);
            if (failed) {
              newState.push({
                key: 'I dont know',
                result: StackedInputActionResult.FAILED,
                message: failed.errorMessage
              });
              return;
            }
            // Update succeeded users
            const succeeded = res.new_invites.find(invite => invite.email === email);
            if (succeeded) {
              newState.push({
                key: 'I dont know',
                result: StackedInputActionResult.SUCCEEDED,
              });
              return;
            }
            // Can't find user for unknown reason, set to failed to can try again
            newState.push({
              key: 'I dont know',
              result: StackedInputActionResult.FAILED,
              message: 'No response for user found'
            });
          });
          this.state.next(newState);
        }
      }),
      map(([res, org, space]) => ({
        success: !res.error,
        message: res.errorMessage
      })),
    );
  }

}
