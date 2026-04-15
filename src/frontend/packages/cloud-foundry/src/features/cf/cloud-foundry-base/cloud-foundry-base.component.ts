import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { UserInviteConfigureService, UserInviteService } from '../user-invites/user-invite.service';

@Component({
  selector: 'app-cloud-foundry-base',
  templateUrl: './cloud-foundry-base.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule
  ],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    UserInviteService,
    UserInviteConfigureService,
    CfUserService,
    CloudFoundryEndpointService,
  ]
})
export class CloudFoundryBaseComponent { }
