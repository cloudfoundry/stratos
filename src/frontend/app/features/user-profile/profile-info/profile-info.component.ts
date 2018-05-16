import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { filter, map, first } from 'rxjs/operators';
import { SessionData } from '../../../store/types/auth.types';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { FetchUserProfileAction } from '../../../store/actions/user-profile.actions';
import { Observable } from 'rxjs/Observable';
import { UserProfileInfo } from '../../../store/types/user-profile.types';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { entityFactory, userProfileSchemaKey } from '../../../store/helpers/entity-factory';
import { UserProfileEffect } from '../../../store/effects/user-profile.effects';
import { UserProfileService } from '../user-profile.service';

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
