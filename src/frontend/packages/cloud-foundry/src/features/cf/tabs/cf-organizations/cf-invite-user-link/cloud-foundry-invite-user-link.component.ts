import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CardWrapperComponent, CardContentComponent } from '../../../../../../../core/src/shared/components/cards';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { createCfOrgSpaceSteppersUrl } from '../../../cf.helpers';
import { UserInviteService } from '../../../user-invites/user-invite.service';

interface UserInviteStepperLink {
  url: string;
  text: string;
}

@Component({
  selector: 'app-cloud-foundry-invite-user-link',
  templateUrl: './cloud-foundry-invite-user-link.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardWrapperComponent,
    CardContentComponent
  ]
})
export class CloudFoundryInviteUserLinkComponent {
  private userInviteService = inject(UserInviteService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private router = inject(Router);


  /** The invite link to show; null until it is known that the user can invite. */
  readonly inviteUserDetails: Signal<UserInviteStepperLink | null> = this.createInviteUserDetails(
    this.activeRouteCfOrgSpace.cfGuid,
    this.activeRouteCfOrgSpace.orgGuid,
    this.activeRouteCfOrgSpace.spaceGuid
  );

  inviteUser(stepperUrl: string) {
    this.router.navigate([stepperUrl]);
  }

  createInviteUserDetails(cfGuid: string, orgGuid: string, spaceGuid: string): Signal<UserInviteStepperLink | null> {
    const canInvite = this.userInviteService.canShowInviteUser(cfGuid, orgGuid, spaceGuid);
    return computed(() => canInvite() ? {
      url: createCfOrgSpaceSteppersUrl(cfGuid, '/users/invite', orgGuid, spaceGuid),
      text: `You can invite users to this ${spaceGuid ? 'space' : 'organization'} via email.`
    } : null);
  }
}
