import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';

import {
  StackedInputActionsState,
  StackedInputActionsUpdate,
} from '../../../../../shared/components/stacked-input-actions/stacked-input-actions.component';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';

@Component({
  selector: 'app-invite-users-create',
  templateUrl: './invite-users-create.component.html',
  styleUrls: ['./invite-users-create.component.scss']
})
export class InviteUsersCreateComponent implements OnInit, OnDestroy {

  valid$: Observable<boolean>;
  stepValid = new BehaviorSubject<boolean>(false);
  // state$: Observable<StackedInputActionsState[]>;
  state = new BehaviorSubject<StackedInputActionsState[]>([]);
  isSpace = false;
  // createUserResults$: Observable<StackedInputActionsState[]>;

  constructor(private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    this.valid$ = this.stepValid.asObservable();
    this.isSpace = !!this.activeRouteCfOrgSpace.spaceGuid || true; // TODO: RC
  }

  updateUsers(users: StackedInputActionsUpdate) {
    this.stepValid.next(users.valid);
  }

  ngOnInit() {
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
  }

  onLeave = (isNext: boolean) => {
    // if (!isNext && this.snackBarRef) {
    //   this.snackBarRef.dismiss();
    //   this.snackBarRef = null;
    // }
  }

  onNext = () => {
    // this.store.dispatch(new UsersRolesSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, [user.entity]));
    // TODO: RC wire in invite service create user function to here
    // TODO: RC what happens if some pass and some fail? Do we re-attempt the passed?
    return observableOf({ success: false });
  }

}
