import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import {
  StackedInputActionsState,
  StackedInputActionsUpdate,
} from '../../../../../shared/components/stacked-input-actions/stacked-input-actions.component';
import { GetOrganization } from '../../../../../store/actions/organization.actions';
import { GetSpace } from '../../../../../store/actions/space.actions';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { SpaceUserRoleNames } from '../../../../../store/types/user.types';
import { UserRoleLabels } from '../../../../../store/types/users-roles.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';

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
  public spaceName$: Observable<string>;
  public isSpace = false;
  public spaceRole: SpaceUserRoleNames = SpaceUserRoleNames.AUDITOR;
  public spaceRoles: { label: string, value: SpaceUserRoleNames }[] = [];
  private users: StackedInputActionsUpdate;

  constructor(
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.valid$ = this.stepValid.asObservable();
    this.spaceRoles.push(
      {
        label: UserRoleLabels.space.short[SpaceUserRoleNames.AUDITOR],
        value: SpaceUserRoleNames.AUDITOR,
      }, {
        label: UserRoleLabels.space.short[SpaceUserRoleNames.DEVELOPER],
        value: SpaceUserRoleNames.DEVELOPER,
      }, {
        label: UserRoleLabels.space.short[SpaceUserRoleNames.MANAGER],
        value: SpaceUserRoleNames.MANAGER,
      });
  }

  updateUsers(users: StackedInputActionsUpdate) {
    this.users = users;
    this.stepValid.next(users.valid);
  }

  ngOnInit() {
    this.isSpace = !!this.activeRouteCfOrgSpace.spaceGuid;
    this.orgName$ = this.entityServiceFactory.create<APIResource<IOrganization>>(
      organizationSchemaKey,
      entityFactory(organizationSchemaKey),
      this.activeRouteCfOrgSpace.orgGuid,
      new GetOrganization(this.activeRouteCfOrgSpace.orgGuid, this.activeRouteCfOrgSpace.cfGuid, [], false)
    ).waitForEntity$.pipe(
      map(entity => entity.entity.entity.name)
    );
    this.spaceName$ = this.isSpace ? this.entityServiceFactory.create<APIResource<ISpace>>(
      spaceSchemaKey,
      entityFactory(spaceSchemaKey),
      this.activeRouteCfOrgSpace.spaceGuid,
      new GetSpace(this.activeRouteCfOrgSpace.spaceGuid, this.activeRouteCfOrgSpace.cfGuid, [], false)
    ).waitForEntity$.pipe(
      map(entity => entity.entity.entity.name)
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

  onNext = () => {
    // this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, [user.entity]));
    // TODO: RC wire in invite service create user function to here. See `users` and `state` for data from and to components
    // TODO: RC wire in response to use this.store.dispatch(new UsersRolesSetUsers(this.activeRouteCfOrgSpace.cfGuid, users));
    // TODO: RC what happens if some pass and some fail? Do we re-attempt the passed/automatically remove inputs/ignore on retry?
    return observableOf({ success: false });
  }

}
