import { Component } from '@angular/core';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

@Component({
  selector: 'app-add-quota',
  templateUrl: './add-quota.component.html',
  styleUrls: ['./add-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class AddQuotaComponent {
  cfQuotasUrl: string;
  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    this.cfQuotasUrl = `/cloud-foundry/${cfId}/quota-definitions`;
  }
}
