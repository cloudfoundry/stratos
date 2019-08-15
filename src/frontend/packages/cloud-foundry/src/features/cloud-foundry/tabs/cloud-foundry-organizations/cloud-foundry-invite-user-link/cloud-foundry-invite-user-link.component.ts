import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

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
  styleUrls: ['./cloud-foundry-invite-user-link.component.scss']
})
export class CloudFoundryInviteUserLinkComponent implements OnInit {

  inviteUserDetails$: Observable<UserInviteStepperLink>;

  constructor(
    private userInviteService: UserInviteService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private router: Router
  ) { }

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
      first(),
      map(canInvite => canInvite ? {
        url: createCfOrgSpaceSteppersUrl(cfGuid, '/users/invite', orgGuid, spaceGuid),
        text: `You can invite users to this ${spaceGuid ? 'space' : 'organization'} via email.`
      } : null)
    );
  }
}
