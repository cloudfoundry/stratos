import { Component } from '@angular/core';

import { CfUserService } from '../../../../../../cloud-foundry/src/shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../features/cf/services/cloud-foundry-organization.service';

@Component({
  selector: 'app-card-cf-org-user-details',
  templateUrl: './card-cf-org-user-details.component.html',
  styleUrls: ['./card-cf-org-user-details.component.scss']
})
export class CardCfOrgUserDetailsComponent {
  constructor(
    public cfOrgService: CloudFoundryOrganizationService,
    public cfUserService: CfUserService,
    public cfEndpointService: CloudFoundryEndpointService
  ) { }
}
