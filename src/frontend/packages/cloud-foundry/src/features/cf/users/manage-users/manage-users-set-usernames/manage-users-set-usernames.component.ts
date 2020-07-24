import { Component, OnInit } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { first, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { PermissionConfig } from '../../../../../../../core/src/core/permissions/current-user-permissions.config';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import {
  StackedInputActionConfig,
} from '../../../../../../../core/src/shared/components/stacked-input-actions/stacked-input-action/stacked-input-action.component';
import {
  StackedInputActionsState,
  StackedInputActionsUpdate,
} from '../../../../../../../core/src/shared/components/stacked-input-actions/stacked-input-actions.component';
import { StepOnNextFunction } from '../../../../../../../core/src/shared/components/stepper/step/step.component';
import {
  UsersRolesSetIsRemove,
  UsersRolesSetIsSetByUsername,
  UsersRolesSetUsers,
} from '../../../../../actions/users-roles.actions';
import { CFFeatureFlagTypes } from '../../../../../cf-api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { CfUser } from '../../../../../store/types/cf-user.types';
import { CfPermissionTypes } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { waitForCFPermissions } from '../../../cf.helpers';

export class ManageUsersSetUsernamesHelper {
  static createGuid(username: string, cfGuid: string, orgGuid: string): string {
    return `${username}/${cfGuid}/${orgGuid}`;
  }

  static usernameFromGuid(guid: string): string {
    const endOfUsername = guid.lastIndexOf('/', guid.lastIndexOf('/') - 1);
    return guid.substring(0, endOfUsername);
  }
}

@Component({
  selector: 'app-manage-users-set-usernames',
  templateUrl: './manage-users-set-usernames.component.html',
  styleUrls: ['./manage-users-set-usernames.component.scss']
})
export class ManageUsersSetUsernamesComponent implements OnInit {

  public stepValid = new BehaviorSubject<boolean>(false);
  public valid$: Observable<boolean> = this.stepValid.asObservable();
  private usernames: StackedInputActionsUpdate;
  public origin: string;
  public canAdd$: Observable<boolean>;
  public canRemove$: Observable<boolean>;
  public blocked$: Observable<boolean>;
  public currentValue: boolean;

  public stackedActionConfig: StackedInputActionConfig = {
    isEmailInput: false,
    text: {
      placeholder: 'Username',
      requiredError: 'Username is required',
      uniqueError: 'Username is not unique'
    }
  };

  public stateIn = new BehaviorSubject<StackedInputActionsState[]>([]);

  constructor(
    private store: Store<CFAppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    userPerms: CurrentUserPermissionsService,
  ) {
    const ffSetPermConfig = new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.set_roles_by_username);
    const ffRemovePermConfig = new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.unset_roles_by_username);
    this.canAdd$ = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(() => userPerms.can(ffSetPermConfig, activeRouteCfOrgSpace.cfGuid)),
      first(),
      publishReplay(1),
      refCount()
    );
    this.canRemove$ = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(() => userPerms.can(ffRemovePermConfig, activeRouteCfOrgSpace.cfGuid)),
      first(),
      publishReplay(1),
      refCount()
    );

    const canAddRemove = combineLatest([this.canAdd$, this.canRemove$]);

    // Set starting value of add/remove radio button
    canAddRemove.pipe(first()).subscribe(([canAdd]) => this.setIsRemove({ source: null, value: !canAdd }))

    // Block content until we know the add/remove state
    this.blocked$ = canAddRemove.pipe(
      map(() => false),
      first(),
      startWith(true),
      publishReplay(1),
      refCount(),
    );

  }

  ngOnInit() {
    this.store.dispatch(new UsersRolesSetIsSetByUsername(true));
    // When we add username validation the processing state should be used to show validation progress and result
    const processingState: StackedInputActionsState[] = [];
    // Object.keys(this.users.values).forEach(key => {
    //   processingState.push({
    //     key,
    //     result: StackedInputActionResult.PROCESSING,
    //   });
    // });
    this.stateIn.next(processingState);
  }

  stateOut(usernames: StackedInputActionsUpdate) {
    this.usernames = usernames;
    this.stepValid.next(usernames.valid);
  }

  setIsRemove(event: MatRadioChange) {
    this.store.dispatch(new UsersRolesSetIsRemove(event.value));
    this.currentValue = event.value;
  }

  onNext: StepOnNextFunction = () => {
    const users: CfUser[] = Object.values(this.usernames.values).map(username => {
      return {
        username,
        guid: ManageUsersSetUsernamesHelper.createGuid(username, this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid)
      } as CfUser;
    });
    this.store.dispatch(new UsersRolesSetUsers(this.activeRouteCfOrgSpace.cfGuid, users, this.origin));
    return of({
      success: true
    });
  }
}
