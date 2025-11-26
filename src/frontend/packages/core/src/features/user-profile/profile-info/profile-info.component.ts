import { ChangeDetectionStrategy, Component  } from '@angular/core';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import type {
  UserProfileInfo,
} from '@stratosui/store';
import { ThemeService, GeneralEntityAppState } from '@stratosui/store';
import { combineLatest, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { UserService } from '../../../core/user.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NoContentMessageComponent } from '../../../shared/components/no-content-message/no-content-message.component';
import { UserProfileBannerComponent } from '../../../shared/components/user-profile-banner/user-profile-banner.component';
import { MetadataItemComponent } from '../../../shared/components/metadata-item/metadata-item.component';
import { ProfileSettingsComponent } from '../../../shared/components/profile-settings/profile-settings.component';
import { AppChipsComponent } from '../../../shared/components/chips/chips.component';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    RouterModule,
    PageHeaderComponent,
    NoContentMessageComponent,
    UserProfileBannerComponent,
    MetadataItemComponent,
    ProfileSettingsComponent,
    AppChipsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileInfoComponent {

  isError$: Observable<boolean>;
  canEdit$: Observable<boolean>;
  userProfile$: Observable<UserProfileInfo>;
  allowGravatar$: Observable<boolean>;

  primaryEmailAddress$: Observable<string>;

  constructor(
    userProfileService: UserProfileService,
    public userService: UserService,
    public themeService: ThemeService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private store: Store<GeneralEntityAppState>
  ) {
    this.isError$ = userProfileService.isError$;
    this.userProfile$ = userProfileService.userProfile$;

    const canEdit = this.isError$.pipe(map(e => !e));
    const hasEditPermissions = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_PROFILE);
    this.canEdit$ = combineLatest([canEdit, hasEditPermissions]).pipe(map(([a, b]) => a && b));

    this.primaryEmailAddress$ = this.userProfile$.pipe(
      map((profile: UserProfileInfo) => userProfileService.getPrimaryEmailAddress(profile))
    );

    this.allowGravatar$ = this.store.select(s => s.dashboard).pipe(
      map(dashboardState => dashboardState.gravatarEnabled)
    );

  }
}
