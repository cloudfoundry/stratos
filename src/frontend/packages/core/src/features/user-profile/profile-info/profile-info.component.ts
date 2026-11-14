import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
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
  standalone: true,
  imports: [
    CommonModule,
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
  userService = inject(UserService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private dashboardSignals = inject(DashboardSignalService);


  private userProfileService = inject(UserProfileService);
  private readonly hasEditPermission = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_PROFILE);

  readonly isError = this.userProfileService.isError;
  readonly userProfile = this.userProfileService.userProfile;
  readonly canEdit = computed(() => !this.isError() && this.hasEditPermission());
  readonly primaryEmailAddress = computed(() => {
    const profile = this.userProfile();
    return profile ? this.userProfileService.getPrimaryEmailAddress(profile) : null;
  });
  readonly allowGravatar = this.dashboardSignals.gravatarEnabled;

  constructor() {
    this.userProfileService.loadUserProfile();
  }
}
