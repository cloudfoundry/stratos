import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { SetPollingEnabledAction, SetSessionTimeoutAction } from '../../../../../store/src/actions/dashboard-actions';
import { AppState } from '../../../../../store/src/app-state';
import { LocalStorageService } from '../../../../../store/src/helpers/local-storage-service';
import { selectSessionData } from '../../../../../store/src/reducers/auth.reducer';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { ThemeService } from '../../../../../store/src/theme.service';
import { UserProfileInfo } from '../../../../../store/src/types/user-profile.types';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { UserService } from '../../../core/user.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { SetGravatarEnabledAction } from './../../../../../store/src/actions/dashboard-actions';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent {

  private dashboardState$ = this.store.select(selectDashboardState);
  private sessionData$ = this.store.select(selectSessionData());

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

  isError$: Observable<boolean>;
  canEdit$: Observable<boolean>;
  userProfile$: Observable<UserProfileInfo>;

  primaryEmailAddress$: Observable<string>;
  hasMultipleThemes: boolean;

  localStorageSize$: Observable<number>;

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
    public userService: UserService,
    public themeService: ThemeService,
    private confirmationService: ConfirmationDialogService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    this.isError$ = userProfileService.isError$;
    this.userProfile$ = userProfileService.userProfile$;

    const canEdit = this.isError$.pipe(map(e => !e));
    const hasEditPermissions = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_PROFILE);
    this.canEdit$ = combineLatest([canEdit, hasEditPermissions]).pipe(map(([a, b]) => a && b));

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => userProfileService.getPrimaryEmailAddress(profile))
    );

    this.hasMultipleThemes = themeService.getThemes().length > 1;

    this.localStorageSize$ = this.sessionData$.pipe(
      map(sessionData => LocalStorageService.localStorageSize(sessionData)),
      filter(bytes => bytes !== -1),
    );
  }

  clearLocalStorage() {
    this.sessionData$.pipe(first()).subscribe(sessionData => LocalStorageService.clearLocalStorage(sessionData, this.confirmationService));
  }

}
