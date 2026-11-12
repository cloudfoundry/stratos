import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CustomSlideToggleComponent } from '../custom-slide-toggle/custom-slide-toggle.component';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';
import { take, filter, map } from 'rxjs/operators';

import {
  LocalStorageService,
  LocalStorageSyncTypes } from '@stratosui/store';
import { StratosBrandingService, ThemeMode } from '@stratosui/theme';
import { BytesToHumanSize } from '../../../core/byte-formatters.pipe';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
import { DashboardDataService } from '../../../core/dashboard-data.service';
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
  private authSignals = inject(AuthSignalService);
  private dashboardSignals = inject(DashboardSignalService);
  private dashboardData = inject(DashboardDataService);
  stratosBranding = inject(StratosBrandingService);
  private confirmationService = inject(ConfirmationDialogService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);


  readonly show = input<{
    [settingName: string]: boolean;
}>({
    [ProfileSettingsTypes.GRAVATAR]: true,
    [ProfileSettingsTypes.SESSION_TIMEOUT]: true,
    [ProfileSettingsTypes.POLLING]: true,
    [ProfileSettingsTypes.THEME]: true,
    [ProfileSettingsTypes.STORAGE]: true
});

  hasMultipleThemes = true;

  // sessionData sourced from the signal-native auth projection. Filter
  // matches the legacy behaviour (gate downstream subscribers until the
  // first non-null payload arrives).
  private sessionData$ = toObservable(this.authSignals.sessionData).pipe(
    filter(sessionData => !!sessionData)
  );

  private readonly userProfileService = inject(UserProfileService);
  private readonly hasEditPermission = toSignal(
    this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_PROFILE), { initialValue: false }
  );
  public readonly canEdit = computed(() => !this.userProfileService.isError() && this.hasEditPermission());

  public types = ProfileSettingsTypes;

  readonly timeoutSession = computed(() => this.dashboardSignals.timeoutSession() ? 'true' : 'false');

  readonly pollingEnabled = computed(() => this.dashboardSignals.pollingEnabled() ? 'true' : 'false');

  readonly gravatarEnabled = computed(() => this.dashboardSignals.gravatarEnabled() ? 'true' : 'false');

  public localStorageSize$ = this.sessionData$.pipe(
    // -1 means the size could not be determined (no user session or storage unavailable)
    map(sessionData => sessionData && sessionData.user ? LocalStorageService.localStorageSize(sessionData) : -1),
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

  public updateTheme(mode: string) {
    this.stratosBranding.setThemeMode(mode as ThemeMode);
  }

  private setSessionTimeout(timeoutSession: boolean) {
    this.dashboardData.setSessionTimeout(timeoutSession);
  }

  public setPollingEnabled(pollingEnabled: boolean) {
    this.dashboardData.setPollingEnabled(pollingEnabled);
  }

  public setGravatarEnabled(gravatarEnabled: boolean) {
    this.dashboardData.setGravatarEnabled(gravatarEnabled);
  }

  clearLocalStorage() {
    this.sessionData$.pipe(take(1)).subscribe(sessionData => {
      if (sessionData && sessionData.user) {
        LocalStorageService.clearLocalStorage(sessionData, this.confirmationService);
      }
    });
  }

  resetTheme() {
    this.confirmAndReset('Reset theme to default?', () => {
      LocalStorageService.clearThemePreferences();
    });
  }

  resetListPreferences() {
    this.sessionData$.pipe(take(1)).subscribe(sessionData => {
      if (sessionData?.user) {
        this.confirmAndReset('Reset list and pagination preferences?', () => {
          LocalStorageService.clearSections(sessionData, [
            LocalStorageSyncTypes.PAGINATION,
            LocalStorageSyncTypes.LISTS,
          ]);
        });
      }
    });
  }

  resetDashboard() {
    this.sessionData$.pipe(take(1)).subscribe(sessionData => {
      if (sessionData?.user) {
        this.confirmAndReset('Reset dashboard preferences (sidebar, home layout)?', () => {
          LocalStorageService.clearSections(sessionData, [
            LocalStorageSyncTypes.DASHBOARD,
          ]);
        });
      }
    });
  }

  private confirmAndReset(message: string, action: () => void) {
    this.confirmationService.openWithCancel(
      { message, confirm: 'Reset', critical: false, title: 'Reset Preferences' },
      (confirmed: boolean) => {
        if (confirmed) {
          action();
          window.location.assign('/user-profile');
        }
      },
      () => {}
    );
  }

}
