import { Component, OnInit } from '@angular/core';

import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganisationService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-organisation.service';
import { CfUserService } from '../../../data-services/cf-user.service';

@Component({
  selector: 'app-card-cf-org-user-details',
  templateUrl: './card-cf-org-user-details.component.html',
  styleUrls: ['./card-cf-org-user-details.component.scss']
})
export class CardCfOrgUserDetailsComponent implements OnInit {


  constructor(
    private cfOrgService: CloudFoundryOrganisationService,
    private cfUserService: CfUserService,
    private cfEndpointService: CloudFoundryEndpointService
  ) {

  }


  ngOnInit() {
  }


}
