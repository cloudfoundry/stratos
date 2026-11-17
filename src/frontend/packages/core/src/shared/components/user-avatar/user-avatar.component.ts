import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileInfo } from '@stratosui/store';

import { MD5 } from './md5';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  standalone: true,
  imports: [
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent {

  readonly size = input('small');
  readonly color = input('normal');

  readonly allowGravatar = input<boolean | null>();
  readonly user = input<UserProfileInfo | null>();

  // Shown instead of the initials when allowed and the user has an email.
  readonly gravatar = computed(() => {
    const emails = this.user()?.emails;
    const email = emails && emails.length > 0 ? emails[0].value : '';
    if (email.length === 0 || !this.allowGravatar()) {
      return null;
    }
    const hash = MD5.hash(email.toLocaleLowerCase().trim());
    return `//gravatar.com/avatar/${hash}?s=64`;
  });

  readonly initials = computed(() => avatarInitials(this.user(), this.allowGravatar()));
}

/**
 * The initials the avatar shows, or null when it shows the Gravatar (allowed
 * and the user has an email) or the user has no name.
 */
export function avatarInitials(user: UserProfileInfo | null | undefined, allowGravatar: boolean | null | undefined): string | null {
  const name = user?.name;
  if (!name || (allowGravatar && user?.emails?.[0]?.value)) {
    return null;
  }
  return (name.givenName ? name.givenName.charAt(0) : '') + (name.familyName ? name.familyName.charAt(0) : '') || null;
}
