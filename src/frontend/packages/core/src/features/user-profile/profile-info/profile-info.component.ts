import { Component } from '@angular/core';
import {
  ThemeService,
  UserProfileInfo,
} from '@stratosui/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { UserService } from '../../../core/user.service';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent {

  isError$: Observable<boolean>;
  canEdit$: Observable<boolean>;
  userProfile$: Observable<UserProfileInfo>;

  primaryEmailAddress$: Observable<string>;

  constructor(
    userProfileService: UserProfileService,
    public userService: UserService,
    public themeService: ThemeService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    this.isError$ = userProfileService.isError$;
    this.userProfile$ = userProfileService.userProfile$;

    const canEdit = this.isError$.pipe(map(e => !e));
    const hasEditPermissions = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_PROFILE);
    this.canEdit$ = combineLatest([canEdit, hasEditPermissions]).pipe(map(([a, b]) => a && b));

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => userProfileService.getPrimaryEmailAddress(profile))
    );

  }
}
