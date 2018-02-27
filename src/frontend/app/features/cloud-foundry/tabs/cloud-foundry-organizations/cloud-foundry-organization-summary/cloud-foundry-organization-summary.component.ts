import { Component, OnInit } from '@angular/core';

import { CloudFoundryOrganisationService } from '../../../services/cloud-foundry-organisation.service';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],

})
export class CloudFoundryOrganizationSummaryComponent implements OnInit {


  constructor(private cfOrgService: CloudFoundryOrganisationService) {

  }

  ngOnInit() {

  }

}
