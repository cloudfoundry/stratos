import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  SetGravatarEnabledAction,
  SetPollingEnabledAction,
  SetSessionTimeoutAction,
} from '../../../../../store/src/actions/dashboard-actions';
import { DashboardOnlyAppState } from '../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { ThemeService } from '../../../../../store/src/theme.service';

export enum ProfileSettingsTypes {
  GRAVATAR,
  SESSION_TIMEOUT,
  POLLING,
  THEME
}
@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent {

  @Input() show: { [settingName: string]: boolean } = {
    [ProfileSettingsTypes.GRAVATAR]: true,
    [ProfileSettingsTypes.SESSION_TIMEOUT]: true,
    [ProfileSettingsTypes.POLLING]: true,
    [ProfileSettingsTypes.THEME]: true,
  }

  public types = ProfileSettingsTypes;

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
  hasMultipleThemes: boolean;

  constructor(
    private store: Store<DashboardOnlyAppState>,
    public themeService: ThemeService
  ) {
    this.hasMultipleThemes = themeService.getThemes().length > 1;

  }

}
