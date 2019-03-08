import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';

import { UserProfileService } from '../user-profile.service';
import { UserProfileInfo } from '../../../../../store/src/types/user-profile.types';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent implements OnInit {

  userProfile$: Observable<UserProfileInfo>;

  primaryEmailAddress$: Observable<string>;

  constructor(private userProfileService: UserProfileService) {
    this.userProfile$ = userProfileService.userProfile$;

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => userProfileService.getPrimaryEmailAddress(profile))
    );
  }

  ngOnInit() {
    this.userProfileService.fetchUserProfile();
  }

}
