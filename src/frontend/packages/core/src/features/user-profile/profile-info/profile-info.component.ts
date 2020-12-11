import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ThemeService } from '../../../../../store/src/theme.service';
import { UserProfileInfo } from '../../../../../store/src/types/user-profile.types';
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
  ) {
    this.isError$ = userProfileService.isError$;
    this.userProfile$ = userProfileService.userProfile$;

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => userProfileService.getPrimaryEmailAddress(profile))
    );

  }
}
