import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SetPollingEnabledAction, SetSessionTimeoutAction } from '../../../../../store/src/actions/dashboard-actions';
import { DashboardOnlyAppState } from '../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { UserProfileInfo } from '../../../../../store/src/types/user-profile.types';
import { ConfirmationDialogConfig } from '../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { UserProfileService } from '../user-profile.service';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent implements OnInit {

  public timeoutSession$ = this.store.select(selectDashboardState).pipe(
    map(dashboardState => dashboardState.timeoutSession ? 'true' : 'false')
  );

  public pollingEnabled$ = this.store.select(selectDashboardState).pipe(
    map(dashboardState => dashboardState.pollingEnabled ? 'true' : 'false'),
  );

  userProfile$: Observable<UserProfileInfo>;

  primaryEmailAddress$: Observable<string>;

  private sessionDialogConfig = new ConfirmationDialogConfig(
    'Disable session timeout',
    'We recommend keeping automatic session timeout enabled to improve the security of your data.',
    'Disable',
    true
  );

  public updateSessionKeepAlive(timeoutSession: boolean) {
    if (!timeoutSession) {
      this.confirmDialog.open(this.sessionDialogConfig, () => this.setSessionTimeout(timeoutSession));
    } else {
      this.setSessionTimeout(timeoutSession);
    }
  }

  private setSessionTimeout(timeoutSession: boolean) {
    this.store.dispatch(new SetSessionTimeoutAction(timeoutSession));
  }

  public setPollingEnabled(pollingEnabled: boolean) {
    this.store.dispatch(new SetPollingEnabledAction(pollingEnabled));
  }

  constructor(
    private userProfileService: UserProfileService,
    private store: Store<DashboardOnlyAppState>,
    private confirmDialog: ConfirmationDialogService,
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
