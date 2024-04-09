import { Component, Input } from '@angular/core';
import { UserProfileInfo } from '@stratosui/store';

import { MD5 } from './md5';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss']
})
export class UserAvatarComponent {

  public initials: string;
  public gravatar: string;

  private canUseGravatar = false;
  private userInfo = null;

  @Input() size = 'small';
  @Input() color = 'normal';

  @Input()
  set allowGravatar(allowed: boolean) {
    this.canUseGravatar = allowed;
    this.update();
  }

  @Input('user')
  set user(user: UserProfileInfo) {
    this.userInfo = user;
    this.update();
  }

  private update() {
    this.initials = null;
    this.gravatar = null;
    const user = this.userInfo;

    if (user) {
      if (user.name) {
        this.initials = user.name.givenName ? user.name.givenName.charAt(0) : '';
        this.initials += user.name.familyName ? user.name.familyName.charAt(0) : '';
      }

      if (user.emails && user.emails.length > 0) {
        const email = user.emails[0].value;
        if (email.length > 0 && this.canUseGravatar) {
          const hash = MD5.hash(email.toLocaleLowerCase().trim());
          this.gravatar = `//gravatar.com/avatar/${hash}?s=64`;
          this.initials = null;
        }
      }
    }
  }
}
