
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import type { UserProfileInfo } from '@stratosui/store';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-user-profile-banner',
  templateUrl: './user-profile-banner.component.html',
  styleUrls: ['./user-profile-banner.component.scss'],
  standalone: true,
  imports: [
    UserAvatarComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileBannerComponent {

  name!: string;
  email!: string;
  username!: string;
  userProfile: unknown;
  canUseGravatar!: boolean;

  @Input()
  set allowGravatar(allowed: boolean) {
    this.canUseGravatar = allowed;
  }

  @Input('user')
  set user(user: UserProfileInfo) {
    this.userProfile = user;
    if (user) {
      this.username = user.userName;
      this.name = `${user.name.givenName} ${user.name.familyName}`;
      this.name = this.name.trim();

      if (user.emails.length > 0) {
        this.email = user.emails[0].value.trim();
      }
    }
  }

}
