import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SetPollingEnabledAction, SetSessionTimeoutAction } from '../../../../../store/src/actions/dashboard-actions';
import { DashboardOnlyAppState } from '../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { UserProfileInfo } from '../../../../../store/src/types/user-profile.types';
import { ThemeService } from '../../../core/theme.service';
import { UserProfileService } from '../../../core/user-profile.service';
import { UserService } from '../../../core/user.service';
import { SetGravatarEnabledAction } from './../../../../../store/src/actions/dashboard-actions';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent {

  public timeoutSession$ = this.store.select(selectDashboardState).pipe(
    map(dashboardState => dashboardState.timeoutSession ? 'true' : 'false')
  );

  public pollingEnabled$ = this.store.select(selectDashboardState).pipe(
    map(dashboardState => dashboardState.pollingEnabled ? 'true' : 'false')
  );

  public gravatarEnabled$ = this.store.select(selectDashboardState).pipe(
    map(dashboardState => dashboardState.gravatarEnabled ? 'true' : 'false')
  );

  public allowGravatar$ = this.store.select(selectDashboardState).pipe(
    map(dashboardState => dashboardState.gravatarEnabled)
  );

  isError$: Observable<boolean>;
  canEdit$: Observable<boolean>;
  userProfile$: Observable<UserProfileInfo>;

  primaryEmailAddress$: Observable<string>;
  hasMultipleThemes: boolean;

  public updateSessionKeepAlive(timeoutSession: string) {
    const newVal = !(timeoutSession === 'true');
    this.setSessionTimeout(newVal);
  }

  public updatePolling(pollingEnabled: string) {
    const newVal = !(pollingEnabled === 'true');
    this.setPollingEnabled(newVal);
  }

  public updateGravatarEnabled(gravatarEnabled: string) {
    const newVal = !(gravatarEnabled === 'true');
    this.setGravatarEnabled(newVal);
  }
  private setSessionTimeout(timeoutSession: boolean) {
    this.store.dispatch(new SetSessionTimeoutAction(timeoutSession));
  }

  public setPollingEnabled(pollingEnabled: boolean) {
    this.store.dispatch(new SetPollingEnabledAction(pollingEnabled));
  }

  public setGravatarEnabled(gravatarEnabled: boolean) {
    this.store.dispatch(new SetGravatarEnabledAction(gravatarEnabled));
  }

  constructor(
    private userProfileService: UserProfileService,
    private store: Store<DashboardOnlyAppState>,
    public userService: UserService,
    public themeService: ThemeService
  ) {
    this.isError$ = userProfileService.isError$;
    this.userProfile$ = userProfileService.userProfile$;
    this.canEdit$ = this.isError$.pipe(map(e => !e));

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => userProfileService.getPrimaryEmailAddress(profile))
    );

    this.hasMultipleThemes = themeService.getThemes().length > 1;
  }

}
