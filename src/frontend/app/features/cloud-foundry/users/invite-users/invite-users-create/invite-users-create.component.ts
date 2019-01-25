import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';

@Component({
  selector: 'app-invite-users-create',
  templateUrl: './invite-users-create.component.html',
  styleUrls: ['./invite-users-create.component.scss']
})
export class InviteUsersCreateComponent implements OnInit, OnDestroy {

  valid$: Observable<boolean> = observableOf(false);

  constructor() { }

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

    return observableOf({ success: false });
  }

}
