import { Component } from '@angular/core';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

@Component({
  selector: 'app-add-organization',
  templateUrl: './add-organization.component.html',
  styleUrls: ['./add-organization.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class AddOrganizationComponent {
  cfUrl: string;
  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    this.cfUrl = `/cloud-foundry/${cfId}/organizations`;
  }
}
