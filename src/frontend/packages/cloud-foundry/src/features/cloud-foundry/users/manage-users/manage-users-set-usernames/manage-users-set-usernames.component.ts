import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of } from 'rxjs';

import {
  StackedInputActionConfig,
} from '../../../../../../../core/src/shared/components/stacked-input-actions/stacked-input-action/stacked-input-action.component';
import {
  StackedInputActionsState,
  StackedInputActionsUpdate,
} from '../../../../../../../core/src/shared/components/stacked-input-actions/stacked-input-actions.component';
import { StepOnNextFunction } from '../../../../../../../core/src/shared/components/stepper/step/step.component';
import { UsersRolesSetUsers } from '../../../../../actions/users-roles.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { CfUser } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';

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

  // TODO: RC wire in valid username
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
  ) { }

  ngOnInit() {

    // TODO: RC
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

  onNext: StepOnNextFunction = () => {
    const users: CfUser[] = Object.values(this.usernames.values).map(username => {
      return {
        username,
        guid: `${this.activeRouteCfOrgSpace.cfGuid}-${this.activeRouteCfOrgSpace.orgGuid}-${username}`
      } as CfUser;
    });
    this.store.dispatch(new UsersRolesSetUsers(this.activeRouteCfOrgSpace.cfGuid, users, this.origin));
    return of({
      success: true
    });
  }
}

// TODO: RC after failure retry stepper and effect doesn't fire