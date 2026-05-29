import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

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
    CloudFoundryEndpointService,
  ]
})
export class CloudFoundryBaseComponent { }
