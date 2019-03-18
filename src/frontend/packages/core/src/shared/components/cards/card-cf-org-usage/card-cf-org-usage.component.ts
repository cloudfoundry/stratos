import { Component } from '@angular/core';

import {
  CloudFoundryOrganizationService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-organization.service';

@Component({
  selector: 'app-card-cf-org-usage',
  templateUrl: './card-cf-org-usage.component.html',
  styleUrls: ['./card-cf-org-usage.component.scss']
})
export class CardCfOrgUsageComponent {
  constructor(public cfOrganizationService: CloudFoundryOrganizationService) { }
}
