
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UserProfileInfo } from '@stratosui/store';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-user-profile-banner',
  templateUrl: './user-profile-banner.component.html',
  standalone: true,
  imports: [
    UserAvatarComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileBannerComponent {

  readonly allowGravatar = input<boolean>();
  readonly user = input<UserProfileInfo>();

  readonly username = computed(() => this.user()?.userName);
  readonly name = computed(() => {
    const user = this.user();
    return user ? `${user.name.givenName} ${user.name.familyName}`.trim() : undefined;
  });
  readonly email = computed(() => {
    const emails = this.user()?.emails;
    return emails && emails.length > 0 ? emails[0].value.trim() : undefined;
  });

}
