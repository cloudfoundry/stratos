import { Component } from '@angular/core';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

@Component({
  selector: 'app-add-space-quota',
  templateUrl: './add-space-quota.component.html',
  styleUrls: ['./add-space-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class AddSpaceQuotaComponent {
  cfSpaceQuotasUrl: string;

  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    const orgId = activeRouteCfOrgSpace.orgGuid;
    this.cfSpaceQuotasUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/space-quota-definitions`;
  }
}
