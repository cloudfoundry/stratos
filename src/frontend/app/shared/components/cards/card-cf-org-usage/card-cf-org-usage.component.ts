import { Component, OnInit } from '@angular/core';

import {
  CloudFoundryOrganisationService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-organisation.service';

@Component({
  selector: 'app-card-cf-org-usage',
  templateUrl: './card-cf-org-usage.component.html',
  styleUrls: ['./card-cf-org-usage.component.scss']
})
export class CardCfOrgUsageComponent implements OnInit {

  constructor(private cfOrganizationService: CloudFoundryOrganisationService) { }

  ngOnInit() {
  }

}
