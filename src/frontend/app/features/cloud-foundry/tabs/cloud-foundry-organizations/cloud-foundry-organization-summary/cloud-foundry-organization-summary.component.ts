import { Component, OnInit } from '@angular/core';

import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],

})
export class CloudFoundryOrganizationSummaryComponent {
  constructor(private cfOrgService: CloudFoundryOrganizationService) { }
}
