import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

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
  styleUrls: ['./cloud-foundry-invite-user-link.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardWrapperComponent,
    CardContentComponent
  ]
})
export class CloudFoundryInviteUserLinkComponent implements OnInit {
  private userInviteService = inject(UserInviteService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private router = inject(Router);


  inviteUserDetails$!: Observable<UserInviteStepperLink | null>;

  ngOnInit() {
    this.inviteUserDetails$ = this.createInviteUserDetails(
      this.activeRouteCfOrgSpace.cfGuid,
      this.activeRouteCfOrgSpace.orgGuid,
      this.activeRouteCfOrgSpace.spaceGuid
    );
  }

  inviteUser(stepperUrl: string) {
    this.router.navigate([stepperUrl]);
  }

  createInviteUserDetails(cfGuid: string, orgGuid: string, spaceGuid?: string): Observable<UserInviteStepperLink> {
    return this.userInviteService.canShowInviteUser(cfGuid, orgGuid, spaceGuid).pipe(
      take(1),
      map(canInvite => canInvite ? {
        url: createCfOrgSpaceSteppersUrl(cfGuid, '/users/invite', orgGuid, spaceGuid),
        text: `You can invite users to this ${spaceGuid ? 'space' : 'organization'} via email.`
      } : null)
    );
  }
}
