import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';

import { UserProfileService } from '../user-profile.service';
import { UserProfileInfo } from '../../../../../store/src/types/user-profile.types';
import { map, first } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { SetSessionTimeoutAction } from '../../../../../store/src/actions/dashboard-actions';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent implements OnInit {

  public timeoutSession$ = this.store.select(selectDashboardState).pipe(
    first(),
    map(dashboardState => dashboardState.timeoutSession)
  );

  userProfile$: Observable<UserProfileInfo>;

  primaryEmailAddress$: Observable<string>;

  public updateSessionKeepAlive(timeoutSession: boolean) {
    this.store.dispatch(new SetSessionTimeoutAction(timeoutSession));
  }

  constructor(
    private userProfileService: UserProfileService,
    private store: Store<AppState>
  ) {
    this.userProfile$ = userProfileService.userProfile$;

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => userProfileService.getPrimaryEmailAddress(profile))
    );
  }

  ngOnInit() {
    this.userProfileService.fetchUserProfile();
  }

}
