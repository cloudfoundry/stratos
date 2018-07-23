import { Component, OnInit } from '@angular/core';

import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CfUserService } from '../../../data-services/cf-user.service';

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
