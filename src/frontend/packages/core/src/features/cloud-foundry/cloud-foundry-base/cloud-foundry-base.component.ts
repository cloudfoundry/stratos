import { Component } from '@angular/core';

import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { UserInviteService } from '../user-invites/user-invite.service';

@Component({
  selector: 'app-cloud-foundry-base',
  templateUrl: './cloud-foundry-base.component.html',
  styleUrls: ['./cloud-foundry-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    UserInviteService,
    CfUserService,
    CloudFoundryEndpointService,
  ]
})
export class CloudFoundryBaseComponent { }
