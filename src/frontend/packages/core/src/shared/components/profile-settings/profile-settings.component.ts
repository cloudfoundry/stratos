import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { CustomSlideToggleComponent } from '../custom-slide-toggle/custom-slide-toggle.component';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';
import { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import {
  AppState,
  LocalStorageService,
  selectDashboardState,
  selectSessionData,
  SetGravatarEnabledAction,
  SetPollingEnabledAction,
  SetSessionTimeoutAction,
  ThemeService,
} from '@stratosui/store';
import { BytesToHumanSize } from '../../../core/byte-formatters.pipe';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { ConfirmationDialogService } from '../confirmation-dialog.service';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';
import { CustomButtonToggleComponent, CustomButtonToggleGroupComponent } from '../custom-button-toggle/custom-button-toggle.component';
import { CardTitleComponent } from '../cards/card-title/card-title.component';

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
  styleUrls: ['./profile-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomSlideToggleComponent,
    CustomIconComponent,
    CustomTooltipDirective,
    CustomButtonToggleComponent,
    CustomButtonToggleGroupComponent,
    BytesToHumanSize,
    CardTitleComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    map(sessionData => sessionData?.user ? LocalStorageService.localStorageSize(sessionData) : -1),
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

  public updateTheme(themeKey: string) {
    this.themeService.setTheme(themeKey);
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
    this.sessionData$.pipe(first()).subscribe(sessionData => {
      if (sessionData?.user) {
        LocalStorageService.clearLocalStorage(sessionData, this.confirmationService);
      }
    });
  }

}
