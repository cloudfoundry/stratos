import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import {
  SetGravatarEnabledAction,
  SetPollingEnabledAction,
  SetSessionTimeoutAction,
} from '../../../../../store/src/actions/dashboard-actions';
import { AppState } from '../../../../../store/src/app-state';
import { LocalStorageService } from '../../../../../store/src/helpers/local-storage-service';
import { selectSessionData } from '../../../../../store/src/reducers/auth.reducer';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { ThemeService } from '../../../../../store/src/theme.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { ConfirmationDialogService } from '../confirmation-dialog.service';

export enum ProfileSettingsTypes {
  GRAVATAR,
  SESSION_TIMEOUT,
  POLLING,
  THEME,
  STORAGE
}
@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent {

  @Input() show: { [settingName: string]: boolean; } = {
    [ProfileSettingsTypes.GRAVATAR]: true,
    [ProfileSettingsTypes.SESSION_TIMEOUT]: true,
    [ProfileSettingsTypes.POLLING]: true,
    [ProfileSettingsTypes.THEME]: true,
    [ProfileSettingsTypes.STORAGE]: true,
  };

  hasMultipleThemes: boolean;

  private dashboardState$ = this.store.select(selectDashboardState);
  private sessionData$ = this.store.select(selectSessionData()).pipe(
    filter(sessionData => !!sessionData)
  );

  public canEdit$: Observable<boolean>;

  public types = ProfileSettingsTypes;

  public timeoutSession$ = this.dashboardState$.pipe(
    map(dashboardState => dashboardState.timeoutSession ? 'true' : 'false')
  );

  public pollingEnabled$ = this.dashboardState$.pipe(
    map(dashboardState => dashboardState.pollingEnabled ? 'true' : 'false')
  );

  public gravatarEnabled$ = this.dashboardState$.pipe(
    map(dashboardState => dashboardState.gravatarEnabled ? 'true' : 'false')
  );

  public allowGravatar$ = this.dashboardState$.pipe(
    map(dashboardState => dashboardState.gravatarEnabled)
  );

  public localStorageSize$ = this.sessionData$.pipe(
    map(sessionData => LocalStorageService.localStorageSize(sessionData)),
    filter(bytes => bytes !== -1),
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

  constructor(
    userProfileService: UserProfileService,
    private store: Store<AppState>,
    public themeService: ThemeService,
    private confirmationService: ConfirmationDialogService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    this.hasMultipleThemes = themeService.getThemes().length > 1;

    const canEdit = userProfileService.isError$.pipe(map(e => !e));
    const hasEditPermissions = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_PROFILE);
    this.canEdit$ = combineLatest([canEdit, hasEditPermissions]).pipe(map(([a, b]) => a && b));
  }

  clearLocalStorage() {
    this.sessionData$.pipe(first()).subscribe(sessionData => LocalStorageService.clearLocalStorage(sessionData, this.confirmationService));
  }

}
